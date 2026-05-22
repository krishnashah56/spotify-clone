/**
 * demo-data.js - High-fidelity mock data for Spotify music analytics
 * Contains top tracks, top artists, recently played tracks, heatmap arrays, and audio features.
 */

export const demoProfile = {
  display_name: "Alex Melodic",
  email: "alex.melodic@spotify.com",
  id: "alex_melodic_stats",
  images: [
    {
      url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80"
    }
  ],
  followers: {
    total: 248
  },
  country: "US",
  product: "premium"
};

// Generates simulated heatmap data for the past 4 weeks (28 days) or just day-of-week (7) vs hour-of-day (24)
export const demoHeatmap = [
  // Sunday (0) to Saturday (6)
  // Each sub-array contains 24 values representing hours 0-23
  [5, 2, 0, 0, 0, 1, 3, 8, 12, 15, 8, 5, 10, 14, 18, 22, 25, 20, 15, 18, 24, 30, 20, 10], // Sun
  [12, 5, 1, 0, 0, 2, 10, 25, 45, 30, 15, 12, 20, 22, 18, 15, 28, 42, 50, 35, 25, 20, 15, 8], // Mon
  [8, 4, 0, 0, 0, 3, 12, 28, 48, 32, 18, 10, 15, 25, 20, 12, 30, 45, 55, 40, 28, 22, 12, 6], // Tue
  [10, 3, 0, 0, 0, 2, 11, 26, 40, 35, 20, 15, 22, 28, 22, 14, 32, 48, 52, 38, 30, 25, 15, 10], // Wed
  [15, 6, 2, 0, 0, 4, 14, 30, 50, 42, 22, 18, 25, 30, 25, 18, 35, 50, 60, 45, 35, 28, 18, 12], // Thu
  [18, 8, 3, 1, 0, 5, 12, 28, 42, 38, 25, 20, 30, 35, 40, 45, 50, 55, 65, 70, 60, 55, 40, 25], // Fri
  [22, 15, 8, 2, 0, 1, 4, 10, 15, 20, 25, 30, 35, 40, 45, 50, 58, 62, 70, 75, 80, 65, 50, 30]  // Sat
];

// Top Tracks list for three timeframes
export const demoTopTracks = {
  short_term: [
    {
      id: "track_1",
      name: "Starboy",
      artists: [{ id: "art_1", name: "The Weeknd" }],
      album: {
        name: "Starboy",
        release_date: "2016-11-25",
        images: [{ url: "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&w=300&q=80" }]
      },
      duration_ms: 230000,
      popularity: 92,
      preview_url: null
    },
    {
      id: "track_2",
      name: "Blinding Lights",
      artists: [{ id: "art_1", name: "The Weeknd" }],
      album: {
        name: "After Hours",
        release_date: "2020-03-20",
        images: [{ url: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=300&q=80" }]
      },
      duration_ms: 200000,
      popularity: 96,
      preview_url: null
    },
    {
      id: "track_3",
      name: "Get Lucky",
      artists: [{ id: "art_2", name: "Daft Punk" }, { id: "art_3", name: "Pharrell Williams" }],
      album: {
        name: "Random Access Memories",
        release_date: "2013-04-19",
        images: [{ url: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=300&q=80" }]
      },
      duration_ms: 249000,
      popularity: 85,
      preview_url: null
    },
    {
      id: "track_4",
      name: "Bad Guy",
      artists: [{ id: "art_4", name: "Billie Eilish" }],
      album: {
        name: "When We All Fall Asleep, Where Do We Go?",
        release_date: "2019-03-29",
        images: [{ url: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=300&q=80" }]
      },
      duration_ms: 194000,
      popularity: 88,
      preview_url: null
    },
    {
      id: "track_5",
      name: "Levitating",
      artists: [{ id: "art_5", name: "Dua Lipa" }],
      album: {
        name: "Future Nostalgia",
        release_date: "2020-03-27",
        images: [{ url: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=300&q=80" }]
      },
      duration_ms: 203000,
      popularity: 89,
      preview_url: null
    },
    {
      id: "track_6",
      name: "Stay",
      artists: [{ id: "art_6", name: "The Kid LAROI" }, { id: "art_7", name: "Justin Bieber" }],
      album: {
        name: "F*CK LOVE 3: OVER YOU",
        release_date: "2021-07-09",
        images: [{ url: "https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?auto=format&fit=crop&w=300&q=80" }]
      },
      duration_ms: 141000,
      popularity: 91,
      preview_url: null
    },
    {
      id: "track_7",
      name: "Humility",
      artists: [{ id: "art_8", name: "Gorillaz" }],
      album: {
        name: "The Now Now",
        release_date: "2018-05-31",
        images: [{ url: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&w=300&q=80" }]
      },
      duration_ms: 197000,
      popularity: 74,
      preview_url: null
    },
    {
      id: "track_8",
      name: "As It Was",
      artists: [{ id: "art_9", name: "Harry Styles" }],
      album: {
        name: "Harry's House",
        release_date: "2022-04-01",
        images: [{ url: "https://images.unsplash.com/photo-1511735111819-9a3f7709049c?auto=format&fit=crop&w=300&q=80" }]
      },
      duration_ms: 167000,
      popularity: 93,
      preview_url: null
    }
  ],
  medium_term: [
    {
      id: "track_2",
      name: "Blinding Lights",
      artists: [{ id: "art_1", name: "The Weeknd" }],
      album: {
        name: "After Hours",
        release_date: "2020-03-20",
        images: [{ url: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=300&q=80" }]
      },
      duration_ms: 200000,
      popularity: 96,
      preview_url: null
    },
    {
      id: "track_3",
      name: "Get Lucky",
      artists: [{ id: "art_2", name: "Daft Punk" }],
      album: {
        name: "Random Access Memories",
        release_date: "2013-04-19",
        images: [{ url: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=300&q=80" }]
      },
      duration_ms: 249000,
      popularity: 85,
      preview_url: null
    },
    {
      id: "track_10",
      name: "Sweater Weather",
      artists: [{ id: "art_10", name: "The Neighbourhood" }],
      album: {
        name: "I Love You.",
        release_date: "2013-04-22",
        images: [{ url: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=300&q=80" }]
      },
      duration_ms: 240000,
      popularity: 89,
      preview_url: null
    },
    {
      id: "track_11",
      name: "Do I Wanna Know?",
      artists: [{ id: "art_11", name: "Arctic Monkeys" }],
      album: {
        name: "AM",
        release_date: "2013-06-19",
        images: [{ url: "https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=300&q=80" }]
      },
      duration_ms: 272000,
      popularity: 90,
      preview_url: null
    },
    {
      id: "track_12",
      name: "Riptide",
      artists: [{ id: "art_12", name: "Vance Joy" }],
      album: {
        name: "Dream Your Life Away",
        release_date: "2014-09-05",
        images: [{ url: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=300&q=80" }]
      },
      duration_ms: 204000,
      popularity: 87,
      preview_url: null
    },
    {
      id: "track_13",
      name: "Intro",
      artists: [{ id: "art_13", name: "The xx" }],
      album: {
        name: "xx",
        release_date: "2009-08-14",
        images: [{ url: "https://images.unsplash.com/photo-1510915228340-29c85a43dcfe?auto=format&fit=crop&w=300&q=80" }]
      },
      duration_ms: 128000,
      popularity: 78,
      preview_url: null
    }
  ],
  long_term: [
    {
      id: "track_3",
      name: "Get Lucky",
      artists: [{ id: "art_2", name: "Daft Punk" }],
      album: {
        name: "Random Access Memories",
        release_date: "2013-04-19",
        images: [{ url: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=300&q=80" }]
      },
      duration_ms: 249000,
      popularity: 85,
      preview_url: null
    },
    {
      id: "track_14",
      name: "Lose Yourself to Dance",
      artists: [{ id: "art_2", name: "Daft Punk" }],
      album: {
        name: "Random Access Memories",
        release_date: "2013-05-17",
        images: [{ url: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=300&q=80" }]
      },
      duration_ms: 353000,
      popularity: 80,
      preview_url: null
    },
    {
      id: "track_11",
      name: "Do I Wanna Know?",
      artists: [{ id: "art_11", name: "Arctic Monkeys" }],
      album: {
        name: "AM",
        release_date: "2013-06-19",
        images: [{ url: "https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=300&q=80" }]
      },
      duration_ms: 272000,
      popularity: 90,
      preview_url: null
    },
    {
      id: "track_15",
      name: "Instant Crush",
      artists: [{ id: "art_2", name: "Daft Punk" }, { id: "art_14", name: "Julian Casablancas" }],
      album: {
        name: "Random Access Memories",
        release_date: "2013-05-17",
        images: [{ url: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=300&q=80" }]
      },
      duration_ms: 337000,
      popularity: 84,
      preview_url: null
    },
    {
      id: "track_16",
      name: "High Hopes",
      artists: [{ id: "art_15", name: "Pink Floyd" }],
      album: {
        name: "The Division Bell",
        release_date: "1994-03-28",
        images: [{ url: "https://images.unsplash.com/photo-1483412033650-1015ddeb83d1?auto=format&fit=crop&w=300&q=80" }]
      },
      duration_ms: 511000,
      popularity: 76,
      preview_url: null
    },
    {
      id: "track_17",
      name: "Bohemian Rhapsody",
      artists: [{ id: "art_16", name: "Queen" }],
      album: {
        name: "A Night at the Opera",
        release_date: "1975-10-31",
        images: [{ url: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=300&q=80" }]
      },
      duration_ms: 354000,
      popularity: 89,
      preview_url: null
    },
    {
      id: "track_18",
      name: "Billie Jean",
      artists: [{ id: "art_17", name: "Michael Jackson" }],
      album: {
        name: "Thriller",
        release_date: "1982-11-30",
        images: [{ url: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=300&q=80" }]
      },
      duration_ms: 294000,
      popularity: 91,
      preview_url: null
    }
  ]
};

// Top Artists list for three timeframes
export const demoTopArtists = {
  short_term: [
    {
      id: "art_1",
      name: "The Weeknd",
      genres: ["pop", "canadian pop", "r&b"],
      images: [{ url: "https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&w=300&q=80" }],
      popularity: 98
    },
    {
      id: "art_2",
      name: "Daft Punk",
      genres: ["electronic", "filter house", "electro"],
      images: [{ url: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=300&q=80" }],
      popularity: 88
    },
    {
      id: "art_4",
      name: "Billie Eilish",
      genres: ["pop", "art pop", "electropop"],
      images: [{ url: "https://images.unsplash.com/photo-1549834185-bd9f078a5dfe?auto=format&fit=crop&w=300&q=80" }],
      popularity: 94
    },
    {
      id: "art_5",
      name: "Dua Lipa",
      genres: ["pop", "uk pop", "dance pop"],
      images: [{ url: "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=300&q=80" }],
      popularity: 91
    },
    {
      id: "art_8",
      name: "Gorillaz",
      genres: ["alternative rock", "art pop", "indie rock"],
      images: [{ url: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&w=300&q=80" }],
      popularity: 81
    }
  ],
  medium_term: [
    {
      id: "art_2",
      name: "Daft Punk",
      genres: ["electronic", "filter house", "electro"],
      images: [{ url: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=300&q=80" }],
      popularity: 88
    },
    {
      id: "art_1",
      name: "The Weeknd",
      genres: ["pop", "canadian pop", "r&b"],
      images: [{ url: "https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&w=300&q=80" }],
      popularity: 98
    },
    {
      id: "art_10",
      name: "The Neighbourhood",
      genres: ["modern alternative rock", "indie pop"],
      images: [{ url: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=300&q=80" }],
      popularity: 85
    },
    {
      id: "art_11",
      name: "Arctic Monkeys",
      genres: ["indie rock", "alternative rock", "garage rock"],
      images: [{ url: "https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=300&q=80" }],
      popularity: 90
    }
  ],
  long_term: [
    {
      id: "art_2",
      name: "Daft Punk",
      genres: ["electronic", "filter house", "electro"],
      images: [{ url: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=300&q=80" }],
      popularity: 88
    },
    {
      id: "art_11",
      name: "Arctic Monkeys",
      genres: ["indie rock", "alternative rock", "garage rock"],
      images: [{ url: "https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=300&q=80" }],
      popularity: 90
    },
    {
      id: "art_15",
      name: "Pink Floyd",
      genres: ["classic rock", "psychedelic rock", "progressive rock"],
      images: [{ url: "https://images.unsplash.com/photo-1483412033650-1015ddeb83d1?auto=format&fit=crop&w=300&q=80" }],
      popularity: 84
    }
  ]
};

// Audio Features representing the mood breakdown
// Calculated averages based on Top Tracks selection
export const demoAudioFeatures = {
  danceability: 0.68,   // High danceability (Daft Punk, The Weeknd, Dua Lipa)
  energy: 0.72,         // Energetic beats
  valence: 0.58,        // Moderately happy vibes
  acousticness: 0.15,   // Mostly electronic/synthetic
  instrumentalness: 0.20, // Some Daft Punk/xx instrumentals
  liveness: 0.18        // Mostly studio recordings
};

// Top genres breakdown
export const demoGenres = [
  { name: "Electronic", percentage: 38 },
  { name: "Pop", percentage: 28 },
  { name: "Indie Rock", percentage: 18 },
  { name: "R&B", percentage: 10 },
  { name: "Psychedelic Rock", percentage: 6 }
];

// Recently Played Tracks
export const demoRecentlyPlayed = [
  {
    track: {
      id: "track_1",
      name: "Starboy",
      artists: [{ name: "The Weeknd" }],
      album: {
        images: [{ url: "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&w=150&q=80" }]
      }
    },
    played_at: new Date(Date.now() - 1000 * 60 * 5).toISOString() // 5 mins ago
  },
  {
    track: {
      id: "track_3",
      name: "Get Lucky",
      artists: [{ name: "Daft Punk" }],
      album: {
        images: [{ url: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=150&q=80" }]
      }
    },
    played_at: new Date(Date.now() - 1000 * 60 * 35).toISOString() // 35 mins ago
  },
  {
    track: {
      id: "track_5",
      name: "Levitating",
      artists: [{ name: "Dua Lipa" }],
      album: {
        images: [{ url: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=150&q=80" }]
      }
    },
    played_at: new Date(Date.now() - 1000 * 60 * 72).toISOString() // ~1 hr 12 mins ago
  },
  {
    track: {
      id: "track_4",
      name: "Bad Guy",
      artists: [{ name: "Billie Eilish" }],
      album: {
        images: [{ url: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=150&q=80" }]
      }
    },
    played_at: new Date(Date.now() - 1000 * 60 * 180).toISOString() // 3 hrs ago
  },
  {
    track: {
      id: "track_8",
      name: "As It Was",
      artists: [{ name: "Harry Styles" }],
      album: {
        images: [{ url: "https://images.unsplash.com/photo-1511735111819-9a3f7709049c?auto=format&fit=crop&w=150&q=80" }]
      }
    },
    played_at: new Date(Date.now() - 1000 * 60 * 360).toISOString() // 6 hrs ago
  }
];

// Music personalities list
export const musicPersonalities = [
  {
    title: "The Synthwave Explorer",
    vibe: "Energetic & Electronic",
    desc: "You thrive in neon-soaked soundscapes and rhythmic synth leads. Your music is futuristic, driving, and perfectly suited for late-night highway drives.",
    colorStart: "#ec4899", // pink-500
    colorEnd: "#8b5cf6",   // violet-500
    badge: "⚡ ELECTRIFYING"
  },
  {
    title: "The Indie Dreamer",
    vibe: "Acoustic & Nostalgic",
    desc: "You prefer acoustic resonance, poetic lyrics, and raw emotional vulnerability. Your playlist feels like a warm cup of tea on a rainy Sunday afternoon.",
    colorStart: "#f59e0b", // amber-500
    colorEnd: "#10b981",   // emerald-500
    badge: "🍃 DREAMY"
  },
  {
    title: "The Chart Topper",
    vibe: "Pop & Dynamic",
    desc: "You love high production value, catchy hooks, and energetic beats. You are always aligned with the global rhythm and top-tier cultural moments.",
    colorStart: "#3b82f6", // blue-500
    colorEnd: "#ec4899",   // pink-500
    badge: "🔥 VIBRANT"
  },
  {
    title: "The Sonic Experimentalist",
    vibe: "Eclectic & Diverse",
    desc: "Your listening habits defy boundaries. You jump from IDM to psychedelic rock to classic vocal jazz, always seeking the unexpected and the avant-garde.",
    colorStart: "#8b5cf6", // violet-500
    colorEnd: "#06b6d4",   // cyan-500
    badge: "🔮 ENIGMATIC"
  }
];

/**
 * Determine a music personality based on top genres and average audio features
 */
export function determinePersonality(genres, features) {
  // Safe defaults
  const mainGenre = (genres && genres.length > 0) ? genres[0].name.toLowerCase() : "pop";
  const energy = features ? features.energy : 0.5;
  const acoustic = features ? features.acousticness : 0.5;

  if (mainGenre.includes("electronic") || mainGenre.includes("dance") || mainGenre.includes("house")) {
    return musicPersonalities[0]; // Synthwave Explorer
  }
  if (acoustic > 0.4 || mainGenre.includes("indie") || mainGenre.includes("folk") || mainGenre.includes("acoustic")) {
    return musicPersonalities[1]; // Indie Dreamer
  }
  if (energy > 0.65 && (mainGenre.includes("pop") || mainGenre.includes("rap") || mainGenre.includes("r&b"))) {
    return musicPersonalities[2]; // Chart Topper
  }
  return musicPersonalities[3]; // Sonic Experimentalist (default eclectic)
}
