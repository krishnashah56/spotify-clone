import os
import time
import urllib.parse
import requests
import yt_dlp
from flask import Flask, request, redirect, session, jsonify, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv

# Load environment variables from .env
load_dotenv()

app = Flask(__name__, static_folder='dist', static_url_path='/')
app.secret_key = os.getenv('FLASK_SECRET_KEY', 'soundvibe_super_secret_session_key')

# CORS: Allow Vercel frontend + local dev to access the Flask API
allowed_origins = [
    os.getenv('FRONTEND_URL', ''),          # e.g. https://your-app.vercel.app
    'http://localhost:5173',
    'http://127.0.0.1:5173',
]
allowed_origins = [o for o in allowed_origins if o]  # remove empty strings
CORS(app, origins=allowed_origins, supports_credentials=True)

# Session cookie config
IS_PRODUCTION = os.getenv('RAILWAY_ENVIRONMENT') or os.getenv('RAILWAY_PROJECT_ID')
app.config['SESSION_COOKIE_SAMESITE'] = 'None' if IS_PRODUCTION else 'Lax'
app.config['SESSION_COOKIE_SECURE'] = bool(IS_PRODUCTION)  # True on Railway (HTTPS), False locally
app.config['SESSION_COOKIE_HTTPONLY'] = True

SCOPES = 'user-read-private user-read-email user-top-read user-read-recently-played'

def get_redirect_uri():
    redirect_uri = os.getenv('SPOTIFY_REDIRECT_URI')
    if redirect_uri:
        return redirect_uri
        
    # Determine domain (localhost vs 127.0.0.1) based on referrer or request host
    host = '127.0.0.1'
    
    # 1. Check referrer
    referrer = request.referrer or ''
    if referrer:
        parsed = urllib.parse.urlparse(referrer)
        if parsed.hostname in ['localhost', '127.0.0.1']:
            host = parsed.hostname
    else:
        # 2. Check request host
        req_host = request.host or ''
        if 'localhost' in req_host:
            host = 'localhost'
        elif '127.0.0.1' in req_host:
            host = '127.0.0.1'
            
    port = int(os.getenv('PORT', 5000))
    return f"http://{host}:{port}/callback"

def get_valid_access_token():
    token = session.get('access_token')
    refresh_token = session.get('refresh_token')
    expires_at = session.get('expires_at')
    
    if not token:
        return None
    
    # If token has expired or is about to expire (within 60 seconds)
    if expires_at and time.time() > expires_at - 60:
        if refresh_token:
            client_id = os.getenv('SPOTIFY_CLIENT_ID')
            client_secret = os.getenv('SPOTIFY_CLIENT_SECRET')
            
            if not client_id or not client_secret:
                print("Missing SPOTIFY_CLIENT_ID or SPOTIFY_CLIENT_SECRET in environment.")
                return None
                
            import base64
            token_url = 'https://accounts.spotify.com/api/token'
            payload = {
                'grant_type': 'refresh_token',
                'refresh_token': refresh_token
            }
            auth_str = f"{client_id}:{client_secret}"
            b64_auth = base64.b64encode(auth_str.encode('utf-8')).decode('utf-8')
            headers = {
                'Authorization': f"Basic {b64_auth}",
                'Content-Type': 'application/x-www-form-urlencoded'
            }
            
            try:
                response = requests.post(token_url, data=payload, headers=headers)
                data = response.json()
                
                if response.status_code == 200 and 'access_token' in data:
                    session['access_token'] = data.get('access_token')
                    if 'refresh_token' in data:
                        session['refresh_token'] = data.get('refresh_token')
                    session['expires_at'] = time.time() + data.get('expires_in', 3600)
                    return session['access_token']
                else:
                    print(f"Failed to refresh token: {data}")
                    session.clear()
                    return None
            except Exception as e:
                print(f"Exception during token refresh: {e}")
                session.clear()
                return None
        else:
            return None
            
    return token

@app.route('/')
def index():
    return app.send_static_file('index.html')

@app.route('/login')
def login():
    client_id = os.getenv('SPOTIFY_CLIENT_ID')
    if not client_id:
        return "Error: SPOTIFY_CLIENT_ID not set in .env", 500
    
    # After auth, always redirect back to the Vite dev server on 127.0.0.1
    # (or the Flask server itself if not using Vite)
    referrer = request.referrer or ''
    parsed_referrer = urllib.parse.urlparse(referrer)
    
    if parsed_referrer.netloc:
        # Replace localhost with 127.0.0.1 for cookie consistency
        netloc = parsed_referrer.netloc.replace('localhost', '127.0.0.1')
        origin = f"{parsed_referrer.scheme}://{netloc}"
    else:
        origin = 'http://127.0.0.1:5173'
    
    auth_params = {
        'response_type': 'code',
        'client_id': client_id,
        'scope': SCOPES,
        'redirect_uri': get_redirect_uri(),
        'show_dialog': 'true',
        'state': origin
    }
        
    auth_url = 'https://accounts.spotify.com/authorize?' + urllib.parse.urlencode(auth_params)
    return redirect(auth_url)

@app.route('/callback')
def callback():
    code = request.args.get('code')
    error = request.args.get('error')
    state = request.args.get('state')
    
    if error:
        return f"Spotify Authorization Error: {error}", 400
    if not code:
        return "Authorization code missing", 400
        
    client_id = os.getenv('SPOTIFY_CLIENT_ID')
    client_secret = os.getenv('SPOTIFY_CLIENT_SECRET')
    
    if not client_id or not client_secret:
        return "Error: SPOTIFY_CLIENT_ID or SPOTIFY_CLIENT_SECRET not set in .env", 500
        
    import base64
    token_url = 'https://accounts.spotify.com/api/token'
    payload = {
        'grant_type': 'authorization_code',
        'code': code,
        'redirect_uri': get_redirect_uri()
    }
    auth_str = f"{client_id}:{client_secret}"
    b64_auth = base64.b64encode(auth_str.encode('utf-8')).decode('utf-8')
    headers = {
        'Authorization': f"Basic {b64_auth}",
        'Content-Type': 'application/x-www-form-urlencoded'
    }
    
    try:
        response = requests.post(token_url, data=payload, headers=headers)
        data = response.json()
        
        if response.status_code != 200 or 'error' in data:
            err_msg = data.get('error_description', data.get('error', 'unknown error'))
            return f"Failed to exchange token: {err_msg}", 400
            
        session['access_token'] = data.get('access_token')
        session['refresh_token'] = data.get('refresh_token')
        session['expires_at'] = time.time() + data.get('expires_in', 3600)
        
        target_origin = state if (state and state.startswith('http')) else '/'
        return redirect(target_origin)
    except Exception as e:
        return f"Callback connection error: {str(e)}", 500

@app.route('/logout')
def logout():
    session.clear()
    return jsonify({'status': 'success'})

@app.route('/api/auth-check')
def auth_check():
    token = get_valid_access_token()
    if token:
        return jsonify({'authenticated': True})
    return jsonify({'authenticated': False})

@app.route('/api/spotify/<path:endpoint>', methods=['GET', 'POST', 'PUT', 'DELETE'])
def spotify_proxy(endpoint):
    token = get_valid_access_token()
    if not token:
        return jsonify({'error': 'Not authenticated'}), 401
        
    url = f"https://api.spotify.com/v1/{endpoint}"
    
    # Forward query parameters
    query_params = request.args.to_dict(flat=False)
    # Flatten single-item lists
    query_params = {k: v[0] if len(v) == 1 else v for k, v in query_params.items()}
    
    headers = {
        'Authorization': f"Bearer {token}"
    }
    
    try:
        # Make proxy request
        if request.method == 'GET':
            res = requests.get(url, params=query_params, headers=headers)
        elif request.method == 'POST':
            res = requests.post(url, json=request.json, params=query_params, headers=headers)
        elif request.method == 'PUT':
            res = requests.put(url, json=request.json, params=query_params, headers=headers)
        elif request.method == 'DELETE':
            res = requests.delete(url, params=query_params, headers=headers)
        else:
            return jsonify({'error': 'Method not supported'}), 405
            
        # Parse response safely
        response_data = {}
        if res.content:
            try:
                response_data = res.json()
            except Exception:
                response_data = {'raw_content': res.text}
                
        return jsonify(response_data), res.status_code
    except Exception as e:
        return jsonify({'error': f"Proxy request failed: {str(e)}"}), 500

@app.route('/api/play')
def play_track():
    track_name = request.args.get('track')
    artist_name = request.args.get('artist')
    
    if not track_name or not artist_name:
        return jsonify({'error': 'Missing track or artist parameter'}), 400
        
    query = f"{track_name} {artist_name} audio"
    ydl_opts = {
        'format': 'bestaudio/best',
        'noplaylist': True,
        'quiet': True,
        'no_warnings': True,
        'default_search': 'ytsearch1',
        'skip_download': True,
    }
    
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(query, download=False)
            if 'entries' in info and len(info['entries']) > 0:
                entry = info['entries'][0]
                return jsonify({
                    'url': entry.get('url'),
                    'title': entry.get('title'),
                    'duration': entry.get('duration')
                })
            else:
                return jsonify({'error': 'No matches found on YouTube'}), 404
    except Exception as e:
        print(f"yt-dlp failed for query '{query}': {e}")
        return jsonify({'error': f"Extraction failed: {str(e)}"}), 500

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    print(f"Starting SoundVibe Python Backend on http://localhost:{port}")
    app.run(host='0.0.0.0', port=port, debug=True)
