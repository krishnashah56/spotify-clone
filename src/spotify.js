/**
 * spotify.js - Spotify OAuth PKCE Flow and API Wrapper
 */

// In production (Vercel), BACKEND_URL = Railway URL. In dev, it's empty (uses Vite proxy)
const BACKEND_URL = (typeof __BACKEND_URL__ !== 'undefined' && __BACKEND_URL__) 
  ? __BACKEND_URL__ 
  : '';

// Spotify authorization scopes needed for the app
const SCOPES = [
  'user-read-private',
  'user-read-email',
  'user-top-read',
  'user-read-recently-played'
];

/**
 * Generate a random string for state and code verifier
 */
function generateRandomString(length) {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const values = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(values).map((x) => possible[x % possible.length]).join('');
}

/**
 * Hash a string (SHA-256) and encode it in base64url
 */
async function sha256(plain) {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  return window.crypto.subtle.digest('SHA-256', data);
}

function base64urlencode(a) {
  return btoa(String.fromCharCode.apply(null, new Uint8Array(a)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Initiate Spotify OAuth Flow via Backend
 */
export async function redirectToSpotifyAuth(clientId, redirectUri) {
  const base = BACKEND_URL || window.location.origin;
  const loginUrl = new URL('/login', base);
  if (clientId) {
    loginUrl.searchParams.set('client_id', clientId);
  }
  window.location.href = loginUrl.toString();
}

/**
 * Request Access Token - dummy for compatibility since callback is handled by Flask
 */
export async function getAccessToken(code) {
  return 'backend_authenticated';
}

/**
 * Get active access token status from Backend
 */
export async function getValidAccessToken() {
  try {
    const response = await fetch(`${BACKEND_URL}/api/auth-check`, { credentials: 'include' });
    const data = await response.json();
    if (data.authenticated) {
      return 'backend_authenticated';
    }
  } catch (err) {
    console.error('Failed to check backend auth status:', err);
  }
  return null;
}

/**
 * Clear Spotify authentication state
 */
export function logoutSpotify() {
  window.localStorage.removeItem('spotify_access_token');
  window.localStorage.removeItem('spotify_refresh_token');
  window.localStorage.removeItem('spotify_token_expires_at');
  // Clear Flask backend session
  fetch(`${BACKEND_URL}/logout`, { credentials: 'include' }).catch(err => console.error('Failed to logout from backend:', err));
}

/**
 * Authenticated API Fetch wrapper pointing to Flask Proxy
 */
async function spotifyFetch(endpoint) {
  const token = await getValidAccessToken();
  if (!token) {
    throw new Error('Not authenticated with Spotify');
  }

  // Fetch through Flask API proxy (Railway in production, local in dev)
  const response = await fetch(`${BACKEND_URL}/api/spotify/${endpoint}`, { credentials: 'include' });

  if (response.status === 401) {
    logoutSpotify();
    window.location.reload();
    throw new Error('Session expired. Please log in again.');
  }

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error?.message || `Spotify API error: ${response.status}`);
  }

  return response.json();
}

/**
 * Fetch User Profile
 */
export function fetchUserProfile() {
  return spotifyFetch('me');
}

/**
 * Fetch Top Tracks
 * @param {string} timeRange - short_term (4 weeks), medium_term (6 months), long_term (all time)
 * @param {number} limit - max 50
 */
export function fetchTopTracks(timeRange = 'medium_term', limit = 50) {
  return spotifyFetch(`me/top/tracks?time_range=${timeRange}&limit=${limit}`);
}

/**
 * Fetch Top Artists
 * @param {string} timeRange - short_term, medium_term, long_term
 * @param {number} limit - max 50
 */
export function fetchTopArtists(timeRange = 'medium_term', limit = 50) {
  return spotifyFetch(`me/top/artists?time_range=${timeRange}&limit=${limit}`);
}

/**
 * Fetch Recently Played
 */
export function fetchRecentlyPlayed(limit = 50) {
  return spotifyFetch('me/player/recently-played?limit=' + limit);
}

/**
 * Fetch Audio Features for multiple tracks
 * @param {Array<string>} trackIds - up to 100 track IDs
 */
export function fetchAudioFeatures(trackIds) {
  if (!trackIds || trackIds.length === 0) return { audio_features: [] };
  const idsParam = trackIds.slice(0, 100).join(',');
  return spotifyFetch(`audio-features?ids=${idsParam}`);
}

