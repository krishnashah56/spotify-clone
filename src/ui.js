/**
 * ui.js - Renders dashboard components, heatmaps, charts, and personality card previews.
 */
import { Chart, registerables } from 'chart.js';
import { createIcons, Play, Pause, Disc, Music, Calendar, Activity, BarChart2, Share2, LogOut, Info, Settings, ChevronLeft, ChevronRight, Clock, Users, Search, Loader2 } from 'lucide';
import { generatePersonalityCard, downloadCanvas } from './canvas-card';
import { determinePersonality } from './demo-data';

// Register all Chart.js components
Chart.register(...registerables);

// Chart instances store to destroy/recreate on updates
let radarChartInstance = null;
let doughnutChartInstance = null;
let dualRadarChartInstance = null;

/**
 * Initialize Lucide icons
 */
export function initIcons() {
  createIcons({
    icons: {
      Play,
      Pause,
      Disc,
      Music,
      Calendar,
      Activity,
      BarChart2,
      Share2,
      LogOut,
      Info,
      Settings,
      ChevronLeft,
      ChevronRight,
      Clock,
      Users,
      Search,
      Loader2
    }
  });
}

/**
 * Format duration in milliseconds to MM:SS
 */
function formatDuration(ms) {
  const minutes = Math.floor(ms / 60000);
  const seconds = ((ms % 60000) / 1000).toFixed(0);
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}

/**
 * Display the user profile header
 */
export function renderUserProfile(profile, isDemo = false) {
  const headerContainer = document.getElementById('user-profile-header');
  if (!headerContainer) return;

  const avatarUrl = profile.images?.[0]?.url || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=150&q=80';
  const followers = profile.followers?.total || 0;

  headerContainer.innerHTML = `
    <div class="user-profile-card">
      <img src="${avatarUrl}" alt="${profile.display_name}" class="profile-avatar">
      <div class="profile-meta">
        <div class="profile-badge-row">
          <span class="user-badge">${profile.product === 'premium' ? 'Premium Listener' : 'Listener'}</span>
          ${isDemo ? '<span class="demo-badge">Demo Mode</span>' : ''}
        </div>
        <h2 class="profile-name">${profile.display_name || 'Spotify User'}</h2>
        <p class="profile-stats">
          <span><strong>${followers}</strong> followers</span> • 
          <span>Region: <strong>${profile.country || 'Global'}</strong></span>
        </p>
      </div>
    </div>
  `;
}

/**
 * Render Top Tracks list
 */
export function renderTopTracks(tracks) {
  const container = document.getElementById('top-tracks-list');
  if (!container) return;

  if (!tracks || tracks.length === 0) {
    container.innerHTML = `<div class="empty-state">No tracks found for this period. Try playing more songs!</div>`;
    return;
  }

  container.innerHTML = tracks.map((item, index) => {
    const track = item.track || item; // Handle both top-tracks structure and recently-played structure
    const albumArt = track.album?.images?.[0]?.url || '';
    const artistNames = track.artists.map(a => a.name).join(', ');
    const duration = formatDuration(track.duration_ms);

    return `
      <div class="list-item track-item" data-index="${index}" data-track-name="${encodeURIComponent(track.name)}" data-artist-name="${encodeURIComponent(artistNames)}" data-album-art="${albumArt}" data-duration-ms="${track.duration_ms}" data-track-id="${track.id}">
        <div class="item-rank">${index + 1}</div>
        <div class="item-img-container">
          <img src="${albumArt}" class="item-art" alt="${track.name}">
          <div class="art-overlay">
            <i data-lucide="play" class="play-icon-sm"></i>
          </div>
        </div>
        <div class="item-info">
          <div class="item-title">${track.name}</div>
          <div class="item-subtitle">${artistNames}</div>
        </div>
        <div class="item-album-name">${track.album?.name || ''}</div>
        <div class="item-popularity">
          <div class="popularity-bar-bg">
            <div class="popularity-bar" style="width: ${track.popularity || 50}%"></div>
          </div>
        </div>
        <div class="item-duration">${duration}</div>
      </div>
    `;
  }).join('');

  initIcons();
}

/**
 * Render Top Artists list
 */
export function renderTopArtists(artists) {
  const container = document.getElementById('top-artists-list');
  if (!container) return;

  if (!artists || artists.length === 0) {
    container.innerHTML = `<div class="empty-state">No artists found for this period. Keep exploring!</div>`;
    return;
  }

  container.innerHTML = artists.map((artist, index) => {
    const artistImage = artist.images?.[0]?.url || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=150&q=80';
    const genres = artist.genres.slice(0, 3).join(', ') || 'Alternative';

    return `
      <div class="artist-grid-card" data-index="${index}">
        <div class="artist-card-rank">${index + 1}</div>
        <div class="artist-img-wrapper">
          <img src="${artistImage}" class="artist-image" alt="${artist.name}">
        </div>
        <div class="artist-card-info">
          <h3 class="artist-card-name">${artist.name}</h3>
          <p class="artist-card-genres">${genres}</p>
        </div>
        <div class="artist-card-popularity">
          <span class="pop-val">${artist.popularity || 50}% Popularity</span>
        </div>
      </div>
    `;
  }).join('');

  initIcons();
}

/**
 * Render Recently Played list
 */
export function renderRecentlyPlayed(recentlyPlayed) {
  const container = document.getElementById('recently-played-list');
  if (!container) return;

  if (!recentlyPlayed || recentlyPlayed.length === 0) {
    container.innerHTML = `<div class="empty-state">No recently played tracks found.</div>`;
    return;
  }

  container.innerHTML = recentlyPlayed.map((item, index) => {
    const track = item.track;
    const albumArt = track.album?.images?.[0]?.url || '';
    const artistNames = track.artists.map(a => a.name).join(', ');
    const playedAt = new Date(item.played_at);
    const relativeTime = getRelativeTime(playedAt);

    return `
      <div class="list-item recent-item track-item" data-index="${index}" data-track-name="${encodeURIComponent(track.name)}" data-artist-name="${encodeURIComponent(artistNames)}" data-album-art="${albumArt}" data-duration-ms="${track.duration_ms}" data-track-id="${track.id}">
        <div class="item-img-container">
          <img src="${albumArt}" class="item-art" alt="${track.name}">
          <div class="art-overlay">
            <i data-lucide="play" class="play-icon-sm"></i>
          </div>
        </div>
        <div class="item-info">
          <div class="item-title">${track.name}</div>
          <div class="item-subtitle">${artistNames}</div>
        </div>
        <div class="recent-time-badge">${relativeTime}</div>
      </div>
    `;
  }).join('');

  initIcons();
}

/**
 * Render Search Results list
 */
export function renderSearchResults(tracks) {
  const container = document.getElementById('search-results-container');
  if (!container) return;

  if (!tracks || tracks.length === 0) {
    container.innerHTML = `<div class="empty-state">No matches found. Try searching for something else!</div>`;
    return;
  }

  container.innerHTML = tracks.map((track, index) => {
    const albumArt = track.album?.images?.[0]?.url || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=80&q=80';
    const artistNames = track.artists ? track.artists.map(a => a.name).join(', ') : 'Unknown Artist';
    const duration = formatDuration(track.duration_ms);

    return `
      <div class="list-item track-item" data-index="${index}" data-track-name="${encodeURIComponent(track.name)}" data-artist-name="${encodeURIComponent(artistNames)}" data-album-art="${albumArt}" data-duration-ms="${track.duration_ms}" data-track-id="${track.id}">
        <div class="item-rank">${index + 1}</div>
        <div class="item-img-container">
          <img src="${albumArt}" class="item-art" alt="${track.name}">
          <div class="art-overlay">
            <i data-lucide="play" class="play-icon-sm"></i>
          </div>
        </div>
        <div class="item-info">
          <div class="item-title">${track.name}</div>
          <div class="item-subtitle">${artistNames}</div>
        </div>
        <div class="item-album-name">${track.album?.name || ''}</div>
        <div class="item-popularity">
          <div class="popularity-bar-bg">
            <div class="popularity-bar" style="width: ${track.popularity || 50}%"></div>
          </div>
        </div>
        <div class="item-duration">${duration}</div>
      </div>
    `;
  }).join('');

  initIcons();
}

// Relative time formatter helper
function getRelativeTime(date) {
  const seconds = Math.floor((new Date() - date) / 1000);
  let interval = Math.floor(seconds / 31536000);
  if (interval >= 1) return interval + "y ago";
  interval = Math.floor(seconds / 2592000);
  if (interval >= 1) return interval + "mo ago";
  interval = Math.floor(seconds / 86400);
  if (interval >= 1) return interval + "d ago";
  interval = Math.floor(seconds / 3600);
  if (interval >= 1) return interval + "h ago";
  interval = Math.floor(seconds / 60);
  if (interval >= 1) return interval + "m ago";
  return "just now";
}

/**
 * Render Listening Heatmap grid
 */
export function renderHeatmap(heatmapData) {
  const container = document.getElementById('heatmap-grid');
  if (!container) return;

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const hours = [
    '12am', '1am', '2am', '3am', '4am', '5am', '6am', '7am', '8am', '9am', '10am', '11am',
    '12pm', '1pm', '2pm', '3pm', '4pm', '5pm', '6pm', '7pm', '8pm', '9pm', '10pm', '11pm'
  ];

  // Build grid structure in HTML
  let gridHTML = '';

  // Draw cells row by row (Days)
  for (let r = 0; r < 7; r++) {
    gridHTML += `<div class="heatmap-row-header">${days[r]}</div>`;
    
    for (let c = 0; c < 24; c++) {
      const val = heatmapData[r][c];
      
      // Determine intensity color scale (0 to 4 levels)
      let level = 0;
      if (val > 0 && val <= 10) level = 1;
      else if (val > 10 && val <= 25) level = 2;
      else if (val > 25 && val <= 50) level = 3;
      else if (val > 50) level = 4;

      gridHTML += `
        <div 
          class="heatmap-cell level-${level}" 
          style="--cell-level: ${level}" 
          data-tooltip="${days[r]} at ${hours[c]}: ${val} tracks played"
        ></div>
      `;
    }
  }

  container.innerHTML = gridHTML;
  
  // Update total counts summary text
  const totalListens = heatmapData.reduce((acc, row) => acc + row.reduce((rAcc, v) => rAcc + v, 0), 0);
  const peakHourIndex = getPeakHour(heatmapData);
  const peakHourStr = hours[peakHourIndex];

  document.getElementById('heatmap-total-minutes').innerText = `${Math.round(totalListens * 3.5)} mins`;
  document.getElementById('heatmap-total-plays').innerText = totalListens;
  document.getElementById('heatmap-peak-hour').innerText = peakHourStr;
}

// Find the peak listening hour index (0-23)
function getPeakHour(heatmapData) {
  const hourTotals = Array(24).fill(0);
  for (let r = 0; r < 7; r++) {
    for (let c = 0; c < 24; c++) {
      hourTotals[c] += heatmapData[r][c];
    }
  }
  return hourTotals.indexOf(Math.max(...hourTotals));
}

/**
 * Render Audio DNA Radar and Genre Diversity Doughnut Charts
 */
export function renderCharts(features, genres) {
  // 1. Destroy existing instances first
  if (radarChartInstance) radarChartInstance.destroy();
  if (doughnutChartInstance) doughnutChartInstance.destroy();

  // Color theme variables matching dark mode
  const gridColor = 'rgba(255, 255, 255, 0.08)';
  const labelColor = 'rgba(255, 255, 255, 0.7)';

  // 2. Render Radar Chart (Audio DNA Features)
  const radarCtx = document.getElementById('radar-chart-canvas').getContext('2d');
  radarChartInstance = new Chart(radarCtx, {
    type: 'radar',
    data: {
      labels: ['Energy', 'Danceability', 'Happiness (Valence)', 'Acousticness', 'Instrumentalness', 'Liveness'],
      datasets: [{
        label: 'My Audio Vibe',
        data: [
          features.energy,
          features.danceability,
          features.valence,
          features.acousticness,
          features.instrumentalness,
          features.liveness
        ],
        backgroundColor: 'rgba(29, 185, 84, 0.2)', // Spotify green
        borderColor: '#1DB954',
        borderWidth: 2,
        pointBackgroundColor: '#1DB954',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: '#1DB954',
        pointRadius: 4,
        pointHoverRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        r: {
          angleLines: { color: gridColor },
          grid: { color: gridColor },
          pointLabels: {
            color: labelColor,
            font: { size: 12, family: 'system-ui' }
          },
          ticks: {
            display: false,
            stepSize: 0.2
          },
          min: 0,
          max: 1.0
        }
      }
    }
  });

  // 3. Render Doughnut Chart (Genre Diversity)
  const doughnutCtx = document.getElementById('doughnut-chart-canvas').getContext('2d');
  
  // Custom glowing gradients for genres
  const colors = [
    '#ec4899', // pink
    '#8b5cf6', // violet
    '#3b82f6', // blue
    '#10b981', // emerald
    '#f59e0b', // amber
  ];

  doughnutChartInstance = new Chart(doughnutCtx, {
    type: 'doughnut',
    data: {
      labels: genres.map(g => g.name),
      datasets: [{
        data: genres.map(g => g.percentage),
        backgroundColor: colors.slice(0, genres.length),
        borderColor: '#11121a',
        borderWidth: 3,
        hoverOffset: 10
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
          labels: {
            color: 'rgba(255, 255, 255, 0.8)',
            font: { size: 13, family: 'system-ui' },
            padding: 15,
            boxWidth: 15,
            boxHeight: 15,
            borderRadius: 4,
            usePointStyle: true
          }
        }
      },
      cutout: '65%'
    }
  });

  // 4. Update Mood Text details based on features
  const energyVal = features.energy;
  const valenceVal = features.valence;
  const acousticVal = features.acousticness;

  let vibeTitle = 'Balanced Chill';
  let vibeDesc = 'Your sound rests in a balanced zone, matching electronic beats with soothing acoustic tones.';

  if (energyVal > 0.7 && valenceVal > 0.6) {
    vibeTitle = 'High-Energy Party';
    vibeDesc = 'Your listening profile is dominated by euphoric, danceable tracks designed to keep you moving.';
  } else if (energyVal < 0.4 && acousticVal > 0.5) {
    vibeTitle = 'Acoustic Oasis';
    vibeDesc = 'You lean toward low-tempo acoustic melodies, folk vibes, and introspective soundscapes.';
  } else if (valenceVal < 0.4 && energyVal > 0.6) {
    vibeTitle = 'Melancholic Intensity';
    vibeDesc = 'Your mood leans dark and heavy. Fast tempos combined with sadder undertones dominate.';
  } else if (valenceVal > 0.6 && energyVal < 0.5) {
    vibeTitle = 'Sunset Chill';
    vibeDesc = 'Smooth, bright melodies with laidback tempos. You prefer cozy, happy tracks.';
  }

  document.getElementById('mood-vibe-title').innerText = vibeTitle;
  document.getElementById('mood-vibe-desc').innerText = vibeDesc;
}

/**
 * Generate and display the Music Personality Card Preview
 */
export async function renderPersonalityCard(profile, topTracks, topArtists, moodScore, genres) {
  const container = document.getElementById('card-preview-container');
  const cardCanvas = document.getElementById('shareable-card-canvas');
  if (!container || !cardCanvas) return;

  // Determine personality details
  const personality = determinePersonality(genres, moodScore);

  // Update DOM card preview fields
  container.className = `card-preview-inner ${personality.title.toLowerCase().replace(/ /g, '-')}`;
  
  // Custom theme gradient styling for DOM preview
  container.style.background = `linear-gradient(135deg, ${personality.colorStart}20 0%, ${personality.colorEnd}20 100%)`;
  container.style.border = `1.5px solid ${personality.colorStart}50`;

  container.innerHTML = `
    <div class="card-p-header">
      <div class="card-logo">
        <span class="p-brand">SOUNDVIBE</span>
        <span class="p-subbrand">ANALYTICS</span>
      </div>
      <div class="card-user">@${profile.display_name || 'user'}</div>
    </div>
    
    <div class="card-p-badge" style="background: ${personality.colorStart}22; border: 1px solid ${personality.colorStart}">
      ${personality.badge}
    </div>

    <h2 class="card-p-title" style="background: linear-gradient(to right, #ffffff, ${personality.colorStart}, ${personality.colorEnd}); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">
      ${personality.title}
    </h2>
    <p class="card-p-desc">${personality.desc}</p>
    
    <div class="card-p-columns">
      <div class="card-p-col">
        <h4>TOP TRACKS</h4>
        <ul>
          ${topTracks.slice(0, 3).map((t, idx) => `
            <li>
              <span class="card-num">${idx + 1}</span>
              <div class="card-item-details">
                <span class="card-item-name">${t.name}</span>
                <span class="card-item-sub">${t.artists[0].name}</span>
              </div>
            </li>
          `).join('')}
        </ul>
      </div>
      <div class="card-p-col">
        <h4>TOP ARTISTS</h4>
        <ul>
          ${topArtists.slice(0, 3).map((a, idx) => `
            <li>
              <span class="card-num">${idx + 1}</span>
              <div class="card-item-details">
                <span class="card-item-name">${a.name}</span>
                <span class="card-item-sub">${a.genres[0] || 'Pop'}</span>
              </div>
            </li>
          `).join('')}
        </ul>
      </div>
    </div>

    <div class="card-p-wave-code">
      <div class="mock-wave-lines" style="--wave-color: ${personality.colorStart}">
        ${Array(35).fill(0).map(() => `<span style="height: ${Math.floor(Math.random() * 25) + 5}px"></span>`).join('')}
      </div>
      <div class="wave-scan-label">SCAN TO EXPLORE YOUR VIBE</div>
    </div>
  `;

  // Draw on the actual high-res canvas (hidden)
  await generatePersonalityCard(cardCanvas, {
    profile,
    personality,
    topTracks,
    topArtists,
    moodScore
  });

  // Hook up download button click event
  const downloadBtn = document.getElementById('btn-download-card');
  if (downloadBtn) {
    // Remove previous listeners by cloning
    const newBtn = downloadBtn.cloneNode(true);
    downloadBtn.parentNode.replaceChild(newBtn, downloadBtn);
    newBtn.addEventListener('click', () => {
      downloadCanvas(cardCanvas, `${profile.display_name.toLowerCase().replace(/ /g, '-')}-soundvibe.png`);
    });
  }
}

/**
 * Render the Decade Time Machine charts and stats
 */
export function renderDecades(tracks) {
  const progressList = document.getElementById('decade-progress-list');
  if (!progressList) return;

  if (!tracks || tracks.length === 0) {
    progressList.innerHTML = `<div class="empty-state">Not enough track history to calculate decades.</div>`;
    return;
  }

  // Group track release years by decade
  const counts = {};
  let total = 0;
  tracks.forEach(item => {
    const track = item.track || item;
    const releaseDate = track.album?.release_date;
    if (releaseDate) {
      const year = parseInt(releaseDate.substring(0, 4), 10);
      if (!isNaN(year)) {
        const decade = Math.floor(year / 10) * 10;
        counts[decade] = (counts[decade] || 0) + 1;
        total++;
      }
    }
  });

  if (total === 0) {
    progressList.innerHTML = `<div class="empty-state">No release dates found for these tracks.</div>`;
    return;
  }

  const decadeShares = Object.entries(counts)
    .map(([decade, count]) => {
      const name = decade === '1900' ? '1900s' : `${decade.substring(2)}s`;
      return {
        decade: parseInt(decade, 10),
        name: name,
        percentage: Math.round((count / total) * 100)
      };
    })
    .sort((a, b) => b.percentage - a.percentage);

  // Render bars
  progressList.innerHTML = decadeShares.map(item => `
    <div class="decade-bar-container">
      <div class="decade-bar-label">
        <span>${item.name} Music</span>
        <span>${item.percentage}%</span>
      </div>
      <div class="decade-bar-bg">
        <div class="decade-bar-fill" style="width: ${item.percentage}%"></div>
      </div>
    </div>
  `).join('');

  // Update left visuals based on dominant decade
  const dominantDecade = decadeShares[0];
  let badgeText = '';
  let eraTitle = '';
  let eraDesc = '';
  let vinylImg = 'https://images.unsplash.com/photo-1539625319135-8d6f74a0c8b2?auto=format&fit=crop&w=300&q=80'; // Default vinyl

  if (dominantDecade.decade >= 2020) {
    badgeText = 'Modern Wave Rider';
    eraTitle = 'Cutting-Edge Soundscapes';
    eraDesc = 'Your music soul is anchored in the present. You thrive on modern production values, trending hits, and contemporary sounds.';
    vinylImg = 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=300&q=80'; // concert
  } else if (dominantDecade.decade >= 2010) {
    badgeText = 'Streaming Era Kid';
    eraTitle = 'Indie-Pop & Alt-Rock Blend';
    eraDesc = 'The decade of massive festivals and streaming algorithms defines your ears. Hip-hop, indie electronic, and synth-pop shape your identity.';
    vinylImg = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=300&q=80'; // headphones
  } else if (dominantDecade.decade >= 2000) {
    badgeText = 'Y2K Enthusiast';
    eraTitle = 'Millennium Electro & Beats';
    eraDesc = 'You carry the vibes of the early 2000s—heavy synthesizers, early indie revivals, and massive electro-clash beats.';
    vinylImg = 'https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=300&q=80'; // cassette
  } else if (dominantDecade.decade >= 1990) {
    badgeText = 'Grunge & Chill Head';
    eraTitle = 'Classic Alternative Vibes';
    eraDesc = 'Guitars, raw vocals, and deep beats. Your listening reflects the Golden Era of rock, hip-hop, and house elements.';
    vinylImg = 'https://images.unsplash.com/photo-1510915228340-29c85a43dcfe?auto=format&fit=crop&w=300&q=80'; // guitar
  } else if (dominantDecade.decade >= 1980) {
    badgeText = '80s Synth Kid';
    eraTitle = 'Retro Pop & Neon Beats';
    eraDesc = 'Drum machines, synthesizers, and massive reverbs. Your sound echoes the peak decade of pop anthems and early electronic club nights.';
    vinylImg = 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=300&q=80'; // neon lights
  } else {
    badgeText = 'Vintage Soul Explorer';
    eraTitle = 'Classic Funk & Rock Head';
    eraDesc = 'You are a time traveler. You value organic arrangements, psychedelic guitars, classic rock, and authentic analog recordings.';
    vinylImg = 'https://images.unsplash.com/photo-1483412033650-1015ddeb83d1?auto=format&fit=crop&w=300&q=80'; // vinyl player
  }

  document.getElementById('retro-era-badge').innerText = badgeText;
  document.getElementById('retro-era-badge').style.borderColor = dominantDecade.decade >= 2010 ? '#1db954' : '#8b5cf6';
  document.getElementById('retro-era-badge').style.color = dominantDecade.decade >= 2010 ? '#1db954' : '#8b5cf6';
  document.getElementById('retro-era-badge').style.background = dominantDecade.decade >= 2010 ? 'rgba(29, 185, 84, 0.1)' : 'rgba(139, 92, 246, 0.1)';
  document.getElementById('retro-vinyl-img').style.borderColor = dominantDecade.decade >= 2010 ? '#1db954' : '#8b5cf6';
  document.getElementById('retro-era-title').innerText = eraTitle;
  document.getElementById('retro-era-desc').innerText = eraDesc;
  document.getElementById('retro-vinyl-img').src = vinylImg;
}

/**
 * Render Vibe Matcher Comparison Score & Radar Chart
 */
export function renderVibeMatcher(userFeatures, friendData) {
  // 1. Calculate compatibility score
  const diffEnergy = Math.abs(userFeatures.energy - friendData.energy);
  const diffValence = Math.abs(userFeatures.valence - friendData.valence);
  const diffDance = Math.abs(userFeatures.danceability - friendData.danceability);
  const avgDiff = (diffEnergy + diffValence + diffDance) / 3;
  const matchPercentage = Math.round((1 - avgDiff) * 100);

  // 2. Set DOM content
  document.getElementById('match-score-val').innerText = `${matchPercentage}%`;
  
  let matchTitle = 'Sonic Acquaintances';
  let matchDesc = 'You both have quite diverse tastes! While one prefers one style of rhythm or acoustic tone, the other marches to their own beat.';

  if (matchPercentage > 90) {
    matchTitle = 'Sonic Soulmates';
    matchDesc = `Wow! You and ${friendData.name} are absolute musical duplicates. Your sound features align almost perfectly, sharing identical preferences for energetic beats and emotional depth.`;
  } else if (matchPercentage > 75) {
    matchTitle = 'Harmonious Blend';
    matchDesc = `Great compatibility! You and ${friendData.name} share a lot of overlaps, particularly in your favorite genres. You have enough similarities to share playlists and enough differences to keep it interesting.`;
  } else if (matchPercentage > 60) {
    matchTitle = 'Rhythmic Pals';
    matchDesc = `Moderate compatibility. You and ${friendData.name} connect on certain rhythms (like dance beats or acoustic sounds), but differ significantly in overall energy and intensity.`;
  }

  document.getElementById('match-title').innerText = matchTitle;
  document.getElementById('match-desc').innerText = matchDesc;

  // 3. Render the Dual Radar Chart using Chart.js
  if (dualRadarChartInstance) {
    dualRadarChartInstance.destroy();
  }

  const dualRadarCtx = document.getElementById('dual-radar-chart').getContext('2d');
  
  // Custom colors for comparison
  const userColor = '#1DB954'; // Spotify green
  const friendColor = '#ec4899'; // Pink-500

  dualRadarChartInstance = new Chart(dualRadarCtx, {
    type: 'radar',
    data: {
      labels: ['Energy', 'Danceability', 'Valence', 'Acousticness', 'Instrumentalness', 'Liveness'],
      datasets: [
        {
          label: 'You',
          data: [
            userFeatures.energy,
            userFeatures.danceability,
            userFeatures.valence,
            userFeatures.acousticness,
            userFeatures.instrumentalness,
            userFeatures.liveness
          ],
          backgroundColor: 'rgba(29, 185, 84, 0.15)',
          borderColor: userColor,
          borderWidth: 2,
          pointBackgroundColor: userColor,
          pointBorderColor: '#fff',
          pointRadius: 3
        },
        {
          label: friendData.name,
          data: [
            friendData.energy,
            friendData.danceability,
            friendData.valence,
            friendData.acousticness,
            friendData.instrumentalness,
            friendData.liveness
          ],
          backgroundColor: 'rgba(236, 72, 153, 0.15)',
          borderColor: friendColor,
          borderWidth: 2,
          pointBackgroundColor: friendColor,
          pointBorderColor: '#fff',
          pointRadius: 3
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'bottom',
          labels: {
            color: 'rgba(255, 255, 255, 0.8)',
            font: { size: 11 }
          }
        }
      },
      scales: {
        r: {
          angleLines: { color: 'rgba(255,255,255,0.06)' },
          grid: { color: 'rgba(255,255,255,0.06)' },
          pointLabels: {
            color: 'rgba(255,255,255,0.6)',
            font: { size: 10 }
          },
          ticks: {
            display: false,
            stepSize: 0.2
          },
          min: 0,
          max: 1.0
        }
      }
    }
  });

  // Reveal results card
  document.getElementById('matcher-results').classList.remove('hidden');
}
