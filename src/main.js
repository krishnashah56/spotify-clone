/**
 * main.js - Core application entry point and controller.
 * Handles state, routing, Spotify API callbacks, and binding events.
 */
import './style.css';
// BACKEND_URL: Railway URL in production (Vercel), empty in development (uses Vite proxy)
const BACKEND_URL = (typeof __BACKEND_URL__ !== 'undefined' && __BACKEND_URL__) 
  ? __BACKEND_URL__ 
  : '';

import { 
  redirectToSpotifyAuth, 
  getAccessToken, 
  getValidAccessToken, 
  logoutSpotify, 
  fetchUserProfile, 
  fetchTopTracks, 
  fetchTopArtists, 
  fetchRecentlyPlayed, 
  fetchAudioFeatures 
} from './spotify';
import { 
  demoProfile, 
  demoTopTracks, 
  demoTopArtists, 
  demoAudioFeatures, 
  demoGenres, 
  demoHeatmap, 
  demoRecentlyPlayed,
  determinePersonality 
} from './demo-data';
import { 
  initIcons, 
  renderUserProfile, 
  renderTopTracks, 
  renderTopArtists, 
  renderRecentlyPlayed, 
  renderHeatmap, 
  renderCharts, 
  renderPersonalityCard,
  renderDecades,
  renderVibeMatcher,
  renderSearchResults
} from './ui';

// Application State
let appState = {
  isDemoMode: false,
  profile: null,
  activePeriod: 'medium_term', // short_term, medium_term, long_term
  activeCategory: 'tracks', // tracks, artists
  tracks: { short_term: [], medium_term: [], long_term: [] },
  artists: { short_term: [], medium_term: [], long_term: [] },
  recentlyPlayed: [],
  heatmap: [],
  audioFeatures: { short_term: {}, medium_term: {}, long_term: {} },
  genres: { short_term: [], medium_term: [], long_term: [] },
  searchResults: []
};

// Default Spotify API credentials values
const DEFAULT_CLIENT_ID = '8d07d458ea194997ae18610152e0bb61'; // Spotify developer app client id (or let them enter their own)

// Audio Player State
let playbackQueue = [];
let currentQueueIndex = -1;
let isPlaying = false;
let audioEl = null;

/**
 * Bootstrap the application
 */
document.addEventListener('DOMContentLoaded', async () => {
  initIcons();
  setupSettingsModal();
  initAudioPlayer();

  // Setup Redirect URI prefill in modal
  const redirectUriInput = document.getElementById('redirect-uri-input');
  if (redirectUriInput) {
    redirectUriInput.value = window.location.origin + '/callback';
  }

  // Setup Track Click Playback
  document.addEventListener('click', async (e) => {
    const trackItem = e.target.closest('.track-item');
    if (!trackItem) return;

    const index = parseInt(trackItem.getAttribute('data-index'), 10);
    const isRecent = trackItem.closest('#recently-played-list') !== null;
    const isSearch = trackItem.closest('#search-results-container') !== null;
    
    let queue = [];
    if (isRecent) {
      queue = appState.recentlyPlayed;
    } else if (isSearch) {
      queue = appState.searchResults;
    } else {
      queue = appState.tracks[appState.activePeriod];
    }

    if (queue && queue.length > 0) {
      playbackQueue = queue.map(item => item.track || item);
      playTrackAtIndex(index);
    }
  });

  // 1. Check for Spotify OAuth Redirect Callback
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');

  if (code) {
    // Show loading state
    document.getElementById('btn-login-spotify').innerHTML = '<span>Exchanging tokens...</span>';
    try {
      await getAccessToken(code);
      // Clean up URL query parameters
      window.history.replaceState({}, document.title, window.location.pathname);
      await loadDashboardData();
    } catch (err) {
      console.error('OAuth token exchange failed:', err);
      alert('Authentication failed: ' + err.message);
      showLandingPage();
    }
    return;
  }

  // 2. Check if already logged in with valid token
  const token = await getValidAccessToken();
  if (token) {
    await loadDashboardData();
    return;
  }

  // 3. Check if returning to a Demo Mode session
  const storedDemo = window.localStorage.getItem('soundvibe_demo_mode');
  if (storedDemo === 'true') {
    loadDemoMode();
    return;
  }

  // Setup Search Input Event Listener with Debounce
  const searchInput = document.getElementById('search-music-input');
  if (searchInput) {
    let debounceTimeout = null;
    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.trim();
      
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
      }
      
      if (!query) {
        appState.searchResults = [];
        renderSearchResults([]);
        return;
      }
      
      debounceTimeout = setTimeout(async () => {
        if (appState.isDemoMode) {
          // Filter tracks from appState.tracks values by song or artist name to simulate search locally
          const allTracks = [
            ...appState.tracks.short_term,
            ...appState.tracks.medium_term,
            ...appState.tracks.long_term
          ].map(item => item.track || item);
          
          // Remove duplicates based on ID
          const uniqueTracksMap = new Map();
          allTracks.forEach(t => {
            if (t && t.id) uniqueTracksMap.set(t.id, t);
          });
          const uniqueTracks = Array.from(uniqueTracksMap.values());
          
          const filtered = uniqueTracks.filter(t => {
            const nameMatch = t.name?.toLowerCase().includes(query.toLowerCase());
            const artistMatch = t.artists?.some(a => a.name?.toLowerCase().includes(query.toLowerCase()));
            return nameMatch || artistMatch;
          });
          
          appState.searchResults = filtered;
          renderSearchResults(filtered);
        } else {
          try {
            const res = await fetch(`${BACKEND_URL}/api/spotify/search?q=${encodeURIComponent(query)}&type=track&limit=20`, { credentials: 'include' });
            const data = await res.json();
            const tracks = data.tracks?.items || [];
            appState.searchResults = tracks;
            renderSearchResults(tracks);
          } catch (err) {
            console.error('Spotify search failed:', err);
          }
        }
      }, 400);
    });
  }

  // 4. Default: Show Landing Page
  showLandingPage();
});

/**
 * Initialize Landing Page UI & Events
 */
function showLandingPage() {
  document.getElementById('landing-page').classList.remove('hidden');
  document.getElementById('dashboard-page').classList.add('hidden');

  // Load configured Client ID if any
  const savedClientId = window.localStorage.getItem('spotify_client_id') || DEFAULT_CLIENT_ID;
  const clientIdInput = document.getElementById('client-id-input');
  if (clientIdInput) {
    clientIdInput.value = savedClientId;
  }

  // Bind Login Trigger
  const loginBtn = document.getElementById('btn-login-spotify');
  loginBtn.onclick = () => {
    const clientId = window.localStorage.getItem('spotify_client_id') || DEFAULT_CLIENT_ID;
    const redirectUri = window.location.origin + '/callback';
    
    if (!clientId) {
      // Prompt modal if Client ID is missing
      toggleConfigModal(true);
      return;
    }
    
    // Redirect to Spotify Authentication Page
    redirectToSpotifyAuth(clientId, redirectUri);
  };

  // Bind Demo Mode Trigger
  const demoBtn = document.getElementById('btn-try-demo');
  demoBtn.onclick = () => {
    loadDemoMode();
  };
}

/**
 * Setup Spotify Settings Configuration Modal
 */
function setupSettingsModal() {
  const toggleBtn = document.getElementById('btn-toggle-config');
  const closeBtn = document.getElementById('btn-close-config');
  const saveBtn = document.getElementById('btn-save-config');
  const modal = document.getElementById('config-modal');

  if (toggleBtn) toggleBtn.addEventListener('click', () => toggleConfigModal(true));
  if (closeBtn) closeBtn.addEventListener('click', () => toggleConfigModal(false));
  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      const clientId = document.getElementById('client-id-input').value.trim();
      const redirectUri = window.location.origin + window.location.pathname;

      if (!clientId) {
        alert('Please enter a valid Client ID.');
        return;
      }

      window.localStorage.setItem('spotify_client_id', clientId);
      window.localStorage.setItem('spotify_redirect_uri', redirectUri);
      toggleConfigModal(false);
      alert('Spotify Credentials Saved Successfully!');
    });
  }

  // Close modal when clicking outside
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) toggleConfigModal(false);
    });
  }
}

function toggleConfigModal(show) {
  const modal = document.getElementById('config-modal');
  if (!modal) return;
  if (show) {
    modal.classList.remove('hidden');
    // Pre-fill fields
    const savedClientId = window.localStorage.getItem('spotify_client_id') || DEFAULT_CLIENT_ID;
    document.getElementById('client-id-input').value = savedClientId;
  } else {
    modal.classList.add('hidden');
  }
}

/**
 * Load and display the dashboard with Demo Data
 */
function loadDemoMode() {
  appState.isDemoMode = true;
  window.localStorage.setItem('soundvibe_demo_mode', 'true');

  // Load from demo-data.js
  appState.profile = demoProfile;
  appState.tracks = demoTopTracks;
  appState.artists = demoTopArtists;
  appState.recentlyPlayed = demoRecentlyPlayed;
  appState.heatmap = demoHeatmap;
  
  // Distribute demo audio features
  appState.audioFeatures = {
    short_term: demoAudioFeatures,
    medium_term: demoAudioFeatures,
    long_term: demoAudioFeatures
  };

  // Generate genres breakdown for each period from artists
  ['short_term', 'medium_term', 'long_term'].forEach(period => {
    appState.genres[period] = calculateGenresFromArtists(appState.artists[period]);
  });

  initializeDashboard();
}

/**
 * Load and display the dashboard with real Spotify API Data
 */
async function loadDashboardData() {
  appState.isDemoMode = false;
  window.localStorage.removeItem('soundvibe_demo_mode');

  try {
    // 1. Fetch User profile
    appState.profile = await fetchUserProfile();

    // 2. Fetch Top Tracks (All periods)
    appState.tracks.short_term = (await fetchTopTracks('short_term', 50)).items;
    appState.tracks.medium_term = (await fetchTopTracks('medium_term', 50)).items;
    appState.tracks.long_term = (await fetchTopTracks('long_term', 50)).items;

    // 3. Fetch Top Artists (All periods)
    appState.artists.short_term = (await fetchTopArtists('short_term', 50)).items;
    appState.artists.medium_term = (await fetchTopArtists('medium_term', 50)).items;
    appState.artists.long_term = (await fetchTopArtists('long_term', 50)).items;

    // 4. Fetch Recently Played
    const recentResponse = await fetchRecentlyPlayed(50);
    appState.recentlyPlayed = recentResponse.items;

    // 5. Generate Heatmap from recently played + baseline
    appState.heatmap = generateHeatmapFromHistory(appState.recentlyPlayed);

    // 6. Calculate genres for all periods
    ['short_term', 'medium_term', 'long_term'].forEach(period => {
      appState.genres[period] = calculateGenresFromArtists(appState.artists[period]);
    });

    // 7. Fetch Audio Features for top tracks of each period to calculate mood score
    await Promise.all(['short_term', 'medium_term', 'long_term'].map(async (period) => {
      const tracks = appState.tracks[period];
      if (tracks.length > 0) {
        const trackIds = tracks.map(t => t.id);
        const featuresData = await fetchAudioFeatures(trackIds);
        appState.audioFeatures[period] = calculateAverageAudioFeatures(featuresData.audio_features);
      } else {
        appState.audioFeatures[period] = demoAudioFeatures; // Fallback
      }
    }));

    initializeDashboard();

  } catch (err) {
    console.error('Error fetching dashboard statistics:', err);
    alert('Failed to load Spotify data: ' + err.message + '\nSwitching to Demo Mode.');
    loadDemoMode();
  }
}

/**
 * Initialize Dashboard UI layout and bind listeners
 */
function initializeDashboard() {
  document.getElementById('landing-page').classList.add('hidden');
  document.getElementById('dashboard-page').classList.remove('hidden');

  // Setup navigation tabs
  setupDashboardTabs();
  
  // Setup Sub-filters (Period & Category)
  setupDataFilters();

  // Setup Vibe Matcher keys comparison events
  setupVibeMatcherEvents();

  // Draw Header Profile
  renderUserProfile(appState.profile, appState.isDemoMode);

  // Load and render current selected tab details
  refreshDashboardView();

  // Setup logout button
  document.getElementById('btn-logout').onclick = () => {
    logoutSpotify();
    window.localStorage.removeItem('soundvibe_demo_mode');
    window.location.reload();
  };
}

/**
 * Set up sidebar tab switches
 */
function setupDashboardTabs() {
  const tabs = document.querySelectorAll('.nav-tab');
  const panes = document.querySelectorAll('.tab-pane');

  tabs.forEach(tab => {
    tab.onclick = () => {
      const target = tab.getAttribute('data-target');
      
      // Update sidebar active buttons
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      // Update active panes
      panes.forEach(pane => {
        if (pane.id === target) {
          pane.classList.add('active');
        } else {
          pane.classList.remove('active');
        }
      });

      // Triggers recalculations/drawings specific to tab load
      if (target === 'mood-tab') {
        const period = appState.activePeriod;
        renderCharts(appState.audioFeatures[period], appState.genres[period]);
      } else if (target === 'decade-tab') {
        const period = appState.activePeriod;
        renderDecades(appState.tracks[period]);
      } else if (target === 'personality-tab') {
        const period = appState.activePeriod;
        renderPersonalityCard(
          appState.profile, 
          appState.tracks[period], 
          appState.artists[period], 
          appState.audioFeatures[period], 
          appState.genres[period]
        );
      }
    };
  });

  // Handle CTA buttons that trigger tab swaps
  document.querySelectorAll('.nav-tab-trigger').forEach(trigger => {
    trigger.onclick = () => {
      const targetTabId = trigger.getAttribute('data-tab-target');
      const tabBtn = document.querySelector(`.nav-tab[data-target="${targetTabId}"]`);
      if (tabBtn) tabBtn.click();
    };
  });
}

/**
 * Set up dashboard period filters and tracks/artists toggles
 */
function setupDataFilters() {
  // Period filter clicks (4 weeks, 6 months, all-time)
  const periods = document.querySelectorAll('.period-tab');
  periods.forEach(btn => {
    btn.onclick = () => {
      periods.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      appState.activePeriod = btn.getAttribute('data-period');
      
      // Refresh items view
      refreshDashboardView();
    };
  });

  // Category toggles (tracks vs artists)
  const toggles = document.querySelectorAll('.toggle-btn');
  toggles.forEach(btn => {
    btn.onclick = () => {
      toggles.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      appState.activeCategory = btn.getAttribute('data-category');

      if (appState.activeCategory === 'tracks') {
        document.getElementById('tracks-view').classList.remove('hidden');
        document.getElementById('artists-view').classList.add('hidden');
      } else {
        document.getElementById('tracks-view').classList.add('hidden');
        document.getElementById('artists-view').classList.remove('hidden');
      }
      
      refreshDashboardView();
    };
  });
}

/**
 * Re-render files based on selected category, period, or tab
 */
function refreshDashboardView() {
  const period = appState.activePeriod;

  // 1. Populate Overview Tab (always runs)
  const topArtistName = appState.artists[period]?.[0]?.name || 'N/A';
  const topTrackName = appState.tracks[period]?.[0]?.name || 'N/A';
  const persona = determinePersonality(appState.genres[period], appState.audioFeatures[period]);

  document.getElementById('overview-top-artist').innerText = topArtistName;
  document.getElementById('overview-top-track').innerText = topTrackName;
  document.getElementById('overview-music-vibe').innerText = persona.vibe;
  document.getElementById('overview-persona-title').innerText = persona.title;
  document.getElementById('overview-persona-desc').innerText = persona.desc;

  renderRecentlyPlayed(appState.recentlyPlayed);

  // 2. Populate Active Category in Top Items Tab
  if (appState.activeCategory === 'tracks') {
    renderTopTracks(appState.tracks[period]);
  } else {
    renderTopArtists(appState.artists[period]);
  }

  // 3. Populate Heatmap Tab
  renderHeatmap(appState.heatmap);

  // 4. Update Unique Features (Decade Time Machine & Vibe Key)
  renderDecades(appState.tracks[period]);

  const userFeatures = appState.audioFeatures[period];
  const userGenres = appState.genres[period];
  const vibeKey = generateVibeKey(appState.profile, userGenres, userFeatures);
  const myKeyInput = document.getElementById('my-vibe-key');
  if (myKeyInput) {
    myKeyInput.value = vibeKey;
  }

  // 5. Force redraw personality card or dynamic views if currently viewed
  const activeTab = document.querySelector('.tab-pane.active');
  if (activeTab) {
    if (activeTab.id === 'personality-tab') {
      renderPersonalityCard(
        appState.profile, 
        appState.tracks[period], 
        appState.artists[period], 
        appState.audioFeatures[period], 
        appState.genres[period]
      );
    } else if (activeTab.id === 'mood-tab') {
      renderCharts(appState.audioFeatures[period], appState.genres[period]);
    } else if (activeTab.id === 'decade-tab') {
      renderDecades(appState.tracks[period]);
    }
  }
}

/**
 * Generate heatmaps: combine actual recent play timestamps with a realistic baseline distribution
 */
function generateHeatmapFromHistory(recentlyPlayed) {
  // 1. Initialize empty 7x24 grid
  const grid = Array(7).fill(0).map(() => Array(24).fill(0));

  // 2. Load background baseline distribution (representing typical commuter & evening listener)
  // Ensures heatmap has a full aesthetic distribution for statistics page look
  const baseline = [
    // Sun
    [2, 1, 0, 0, 0, 1, 2, 4, 6, 8, 5, 4, 6, 8, 10, 12, 15, 12, 10, 12, 15, 18, 12, 5],
    // Mon
    [6, 3, 0, 0, 0, 1, 5, 15, 25, 18, 8, 6, 12, 15, 10, 8, 14, 25, 30, 20, 15, 12, 8, 4],
    // Tue
    [4, 2, 0, 0, 0, 1, 6, 16, 26, 18, 10, 5, 10, 15, 12, 8, 15, 28, 32, 22, 16, 14, 8, 3],
    // Wed
    [5, 2, 0, 0, 0, 1, 5, 15, 22, 20, 12, 8, 14, 18, 12, 9, 16, 26, 30, 22, 18, 15, 10, 5],
    // Thu
    [8, 3, 1, 0, 0, 2, 7, 18, 28, 24, 12, 10, 15, 18, 15, 10, 18, 28, 35, 25, 20, 16, 10, 6],
    // Fri
    [10, 4, 1, 0, 0, 2, 6, 16, 24, 22, 15, 12, 18, 20, 24, 28, 30, 32, 38, 40, 35, 30, 24, 15],
    // Sat
    [12, 8, 4, 1, 0, 0, 2, 6, 8, 12, 15, 18, 20, 24, 26, 30, 35, 38, 42, 45, 48, 40, 30, 18]
  ];

  // Merge baseline
  for (let r = 0; r < 7; r++) {
    for (let c = 0; c < 24; c++) {
      grid[r][c] = baseline[r][c];
    }
  }

  // 3. Layer real user playback data on top
  recentlyPlayed.forEach((item) => {
    const playedAt = new Date(item.played_at);
    const day = playedAt.getDay(); // 0 (Sun) to 6 (Sat)
    const hour = playedAt.getHours(); // 0 to 23

    grid[day][hour] += 8; // Boost weight of real plays so they display strongly
  });

  return grid;
}

/**
 * Compute average properties of tracks' audio features
 */
function calculateAverageAudioFeatures(featuresList) {
  const sum = { danceability: 0, energy: 0, valence: 0, acousticness: 0, instrumentalness: 0, liveness: 0 };
  let count = 0;

  featuresList.forEach(feat => {
    if (feat) {
      sum.danceability += feat.danceability;
      sum.energy += feat.energy;
      sum.valence += feat.valence;
      sum.acousticness += feat.acousticness;
      sum.instrumentalness += feat.instrumentalness;
      sum.liveness += feat.liveness;
      count++;
    }
  });

  if (count === 0) return demoAudioFeatures;

  return {
    danceability: Number((sum.danceability / count).toFixed(2)),
    energy: Number((sum.energy / count).toFixed(2)),
    valence: Number((sum.valence / count).toFixed(2)),
    acousticness: Number((sum.acousticness / count).toFixed(2)),
    instrumentalness: Number((sum.instrumentalness / count).toFixed(2)),
    liveness: Number((sum.liveness / count).toFixed(2))
  };
}

/**
 * Aggregate genres counts and calculate percentages from top artists
 */
function calculateGenresFromArtists(artists) {
  if (!artists || artists.length === 0) return demoGenres;

  const genreCounts = {};
  let totalCount = 0;

  artists.forEach(artist => {
    if (artist.genres) {
      artist.genres.forEach(genre => {
        genreCounts[genre] = (genreCounts[genre] || 0) + 1;
        totalCount++;
      });
    }
  });

  if (totalCount === 0) return demoGenres;

  // Format and sort top 5
  return Object.entries(genreCounts)
    .map(([name, count]) => {
      // Capitalize genre words
      const capitalized = name.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      return {
        name: capitalized,
        percentage: Math.round((count / totalCount) * 100)
      };
    })
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, 5);
}

/**
 * Encode user profile and features into a Base64-safe Vibe Key string
 */
function generateVibeKey(profile, genres, features) {
  const name = profile?.display_name || 'User';
  const topGenre = genres?.[0]?.name || 'Pop';
  const payload = {
    name: name,
    genre: topGenre,
    energy: features.energy,
    valence: features.valence,
    danceability: features.danceability,
    acousticness: features.acousticness,
    instrumentalness: features.instrumentalness,
    liveness: features.liveness
  };
  try {
    const str = JSON.stringify(payload);
    // UTF-8 safe Base64 encoding
    const base64 = btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (match, p1) => {
      return String.fromCharCode(parseInt(p1, 16));
    }));
    return `SV-${base64}`;
  } catch (e) {
    console.error('Error generating vibe key:', e);
    return 'SV-Error';
  }
}

/**
 * Decode friend's Base64-safe Vibe Key string back to JSON payload
 */
function decodeVibeKey(key) {
  if (!key.startsWith('SV-')) return null;
  const base64 = key.substring(3);
  try {
    // UTF-8 safe Base64 decoding
    const str = decodeURIComponent(atob(base64).split('').map(c => {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(str);
  } catch (e) {
    console.error('Error decoding vibe key:', e);
    return null;
  }
}

/**
 * Setup Vibe Matcher copy/compare listeners
 */
function setupVibeMatcherEvents() {
  const btnCopy = document.getElementById('btn-copy-vibe-key');
  const btnCompare = document.getElementById('btn-compare-vibe');
  const inputFriendKey = document.getElementById('friend-vibe-key');
  const errorDiv = document.getElementById('matcher-error');

  if (btnCopy) {
    btnCopy.onclick = () => {
      const keyInput = document.getElementById('my-vibe-key');
      if (keyInput) {
        keyInput.select();
        navigator.clipboard.writeText(keyInput.value);
        btnCopy.innerText = 'Copied!';
        setTimeout(() => {
          btnCopy.innerText = 'Copy Key';
        }, 2000);
      }
    };
  }

  if (btnCompare) {
    btnCompare.onclick = () => {
      const key = inputFriendKey.value.trim();
      if (!key.startsWith('SV-')) {
        errorDiv.innerText = 'Invalid Vibe Key. Make sure it starts with "SV-"';
        errorDiv.classList.remove('hidden');
        return;
      }
      errorDiv.classList.add('hidden');
      
      const friendData = decodeVibeKey(key);
      if (!friendData) {
        errorDiv.innerText = 'Invalid or corrupt Vibe Key.';
        errorDiv.classList.remove('hidden');
        return;
      }

      // Get user features of current active period
      const period = appState.activePeriod;
      const userFeatures = appState.audioFeatures[period];
      
      // Call UI to calculate match and render dual radar chart
      renderVibeMatcher(userFeatures, friendData);
    };
  }
}

/**
 * Initialize Audio Player elements and bind listeners
 */
function initAudioPlayer() {
  audioEl = document.getElementById('global-audio-element');
  const playerBar = document.getElementById('music-player-bar');
  const playPauseBtn = document.getElementById('player-btn-play-pause');
  const prevBtn = document.getElementById('player-btn-prev');
  const nextBtn = document.getElementById('player-btn-next');
  const volumeSlider = document.getElementById('player-volume-slider');
  const seekContainer = document.getElementById('player-seek-container');
  const seekFill = document.getElementById('player-seek-fill');
  const seekHandle = document.getElementById('player-seek-handle');

  if (!audioEl) return;

  // Set default volume
  audioEl.volume = 0.8;

  // 1. Audio events
  audioEl.addEventListener('play', () => {
    isPlaying = true;
    playerBar.classList.add('playing');
    const playIcon = document.getElementById('player-play-icon');
    if (playIcon) {
      playIcon.setAttribute('data-lucide', 'pause');
      initIcons();
    }
  });

  audioEl.addEventListener('pause', () => {
    isPlaying = false;
    playerBar.classList.remove('playing');
    const playIcon = document.getElementById('player-play-icon');
    if (playIcon) {
      playIcon.setAttribute('data-lucide', 'play');
      initIcons();
    }
  });

  audioEl.addEventListener('timeupdate', () => {
    if (!audioEl.duration) return;
    const progress = (audioEl.currentTime / audioEl.duration) * 100;
    seekFill.style.width = `${progress}%`;
    seekHandle.style.left = `${progress}%`;
    updateTimeDisplay();
  });

  audioEl.addEventListener('loadedmetadata', () => {
    updateTimeDisplay();
  });

  audioEl.addEventListener('ended', () => {
    playNextTrack();
  });

  audioEl.addEventListener('error', (e) => {
    console.error("Audio playback error:", e);
    const songTitleEl = document.getElementById('player-song-title');
    if (songTitleEl) {
      songTitleEl.innerText = "Error loading stream...";
    }
    setTimeout(() => {
      playNextTrack();
    }, 2000);
  });

  // 2. Play/Pause toggle
  playPauseBtn.onclick = () => {
    if (!audioEl.src) return;
    if (isPlaying) {
      audioEl.pause();
    } else {
      audioEl.play().catch(err => console.error("Playback play failed:", err));
    }
  };

  // 3. Skip controls
  prevBtn.onclick = () => {
    playPreviousTrack();
  };

  nextBtn.onclick = () => {
    playNextTrack();
  };

  // 4. Volume control
  if (volumeSlider) {
    volumeSlider.oninput = () => {
      audioEl.volume = volumeSlider.value / 100;
    };
  }

  // 5. Seek click control
  if (seekContainer) {
    seekContainer.onclick = (e) => {
      if (!audioEl.duration) return;
      const rect = seekContainer.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const percentage = clickX / rect.width;
      audioEl.currentTime = percentage * audioEl.duration;
    };
  }
}

/**
 * Format standard time display (elapsed / total)
 */
function updateTimeDisplay() {
  const timeDisplay = document.getElementById('player-time-display');
  if (!timeDisplay || !audioEl) return;
  
  const formatSeconds = (secs) => {
    if (isNaN(secs) || secs === Infinity) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  timeDisplay.innerText = `${formatSeconds(audioEl.currentTime)} / ${formatSeconds(audioEl.duration)}`;
}

/**
 * Play a track by programmatic index in current queue
 */
async function playTrackAtIndex(index) {
  if (index < 0 || index >= playbackQueue.length) return;
  currentQueueIndex = index;
  const track = playbackQueue[index];
  
  // Show player bar
  const playerBar = document.getElementById('music-player-bar');
  if (playerBar) {
    playerBar.classList.remove('hidden');
  }

  const albumArtEl = document.getElementById('player-album-art');
  const songTitleEl = document.getElementById('player-song-title');
  const songArtistEl = document.getElementById('player-song-artist');
  const playIcon = document.getElementById('player-play-icon');

  // Update UI with loading state and song meta
  const artistNames = track.artists ? track.artists.map(a => a.name).join(', ') : 'Unknown Artist';
  const albumArtUrl = track.album?.images?.[0]?.url || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=80&q=80';

  if (albumArtEl) albumArtEl.src = albumArtUrl;
  if (songTitleEl) songTitleEl.innerText = track.name;
  if (songArtistEl) songArtistEl.innerText = `${artistNames} (Loading...)`;
  if (playIcon) {
    playIcon.setAttribute('data-lucide', 'loader-2');
    playIcon.classList.add('icon-spin');
    initIcons();
  }

  try {
    const res = await fetch(`${BACKEND_URL}/api/play?track=${encodeURIComponent(track.name)}&artist=${encodeURIComponent(artistNames)}`, { credentials: 'include' });
    const data = await res.json();

    if (data.error || !data.url) {
      throw new Error(data.error || 'Failed to fetch stream URL');
    }

    if (songArtistEl) songArtistEl.innerText = artistNames;
    if (playIcon) {
      playIcon.classList.remove('icon-spin');
      playIcon.setAttribute('data-lucide', 'pause');
      initIcons();
    }

    audioEl.src = data.url;
    await audioEl.play();
  } catch (err) {
    console.error("Failed to load and play track from YouTube:", err);
    if (songArtistEl) songArtistEl.innerText = `${artistNames} (Error loading)`;
    if (playIcon) {
      playIcon.classList.remove('icon-spin');
      playIcon.setAttribute('data-lucide', 'play');
      initIcons();
    }
  }
}

function playNextTrack() {
  if (playbackQueue.length === 0) return;
  const nextIdx = (currentQueueIndex + 1) % playbackQueue.length;
  playTrackAtIndex(nextIdx);
}

function playPreviousTrack() {
  if (playbackQueue.length === 0) return;
  let prevIdx = currentQueueIndex - 1;
  if (prevIdx < 0) prevIdx = playbackQueue.length - 1;
  playTrackAtIndex(prevIdx);
}
