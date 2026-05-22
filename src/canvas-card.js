/**
 * canvas-card.js - High-resolution canvas renderer for shareable music personality cards.
 */

/**
 * Load an image with CORS support. Returns null if loading fails.
 */
function loadImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = src;
    img.onload = () => resolve(img);
    img.onerror = () => {
      console.warn(`Failed to load image for canvas card: ${src}`);
      resolve(null); // Return null on error so we can draw a placeholder
    };
  });
}

/**
 * Draw a rounded rectangle with optional fill and stroke
 */
function drawRoundedRect(ctx, x, y, width, height, radius, fillStyle, strokeStyle, strokeWidth = 1) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();

  if (fillStyle) {
    ctx.fillStyle = fillStyle;
    ctx.fill();
  }

  if (strokeStyle) {
    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth = strokeWidth;
    ctx.stroke();
  }
}

/**
 * Generate and download the personality card
 * @param {Object} options - { profile, personality, topTracks, topArtists, moodScore }
 */
export async function generatePersonalityCard(canvas, { profile, personality, topTracks, topArtists, moodScore }) {
  const ctx = canvas.getContext('2d');
  
  // Set dimensions (high resolution: 800 x 1200 for 2:3 aspect ratio, ideal for sharing)
  canvas.width = 800;
  canvas.height = 1200;

  // 1. Draw Background Gradient
  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  grad.addColorStop(0, '#0d0e15'); // Deep dark slate
  grad.addColorStop(0.5, '#161725');
  grad.addColorStop(1, '#08080f');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 2. Draw Decorative Glowing Orbs in background
  // Top-left glowing blob
  let radialGrad = ctx.createRadialGradient(100, 100, 10, 200, 200, 400);
  radialGrad.addColorStop(0, personality.colorStart + '40'); // 25% opacity
  radialGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = radialGrad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Bottom-right glowing blob
  radialGrad = ctx.createRadialGradient(700, 1100, 10, 600, 1000, 450);
  radialGrad.addColorStop(0, personality.colorEnd + '40'); // 25% opacity
  radialGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = radialGrad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Center subtle glowing blob
  radialGrad = ctx.createRadialGradient(400, 600, 50, 400, 600, 300);
  radialGrad.addColorStop(0, '#ffffff08');
  radialGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = radialGrad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 3. Draw Grid/Pattern overlay
  ctx.strokeStyle = '#ffffff04';
  ctx.lineWidth = 1;
  const gridSize = 40;
  for (let x = 0; x < canvas.width; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }
  for (let y = 0; y < canvas.height; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }

  // 4. Draw Main Card Glass Container
  const pad = 50;
  const cardW = canvas.width - pad * 2; // 700
  const cardH = canvas.height - pad * 2; // 1100
  drawRoundedRect(
    ctx, 
    pad, 
    pad, 
    cardW, 
    cardH, 
    30, 
    'rgba(255, 255, 255, 0.03)', 
    'rgba(255, 255, 255, 0.08)', 
    2
  );

  // 5. Draw Header (Logo & Branding)
  ctx.textBaseline = 'top';
  
  // App Logo/Name
  ctx.font = '700 24px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('SOUNDVIBE', pad + 40, pad + 40);
  
  ctx.font = '400 16px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = '#1DB954'; // Spotify Green
  ctx.fillText('ANALYTICS', pad + 195, pad + 46);

  // User Profile
  const avatarUrl = profile.images?.[0]?.url;
  let avatarImg = null;
  if (avatarUrl) {
    avatarImg = await loadImage(avatarUrl);
  }

  const avatarX = canvas.width - pad - 40 - 60;
  const avatarY = pad + 35;
  const avatarSize = 60;

  if (avatarImg) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(avatarImg, avatarX, avatarY, avatarSize, avatarSize);
    ctx.restore();
    
    // Circle border for avatar
    ctx.beginPath();
    ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 2;
    ctx.stroke();
  } else {
    // Standard avatar placeholder
    drawRoundedRect(
      ctx,
      avatarX,
      avatarY,
      avatarSize,
      avatarSize,
      avatarSize / 2,
      'rgba(255, 255, 255, 0.1)',
      'rgba(255, 255, 255, 0.2)',
      2
    );
    ctx.font = '600 22px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(
      (profile.display_name || 'U').charAt(0).toUpperCase(),
      avatarX + avatarSize / 2,
      avatarY + avatarSize / 2
    );
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
  }

  // User Name and Date Label
  ctx.font = '600 18px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(profile.display_name || 'Spotify Listener', avatarX - 15 - ctx.measureText(profile.display_name || 'Spotify Listener').width, pad + 42);

  ctx.font = '400 14px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
  const dateStr = new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }).toUpperCase();
  ctx.fillText(dateStr, avatarX - 15 - ctx.measureText(dateStr).width, pad + 65);

  // 6. Draw Personality Badge
  const badgeText = personality.badge;
  ctx.font = 'bold 14px system-ui, -apple-system, sans-serif';
  const badgeW = ctx.measureText(badgeText).width + 30;
  const badgeH = 34;
  const badgeX = pad + 40;
  const badgeY = pad + 120;
  
  // Custom glowing background for badge
  drawRoundedRect(
    ctx, 
    badgeX, 
    badgeY, 
    badgeW, 
    badgeH, 
    17, 
    personality.colorStart + '25', 
    personality.colorStart, 
    1.5
  );
  
  ctx.fillStyle = '#ffffff';
  ctx.textBaseline = 'middle';
  ctx.fillText(badgeText, badgeX + 15, badgeY + badgeH / 2 + 1);
  ctx.textBaseline = 'top';

  // 7. Draw Personality Title
  ctx.font = 'bold 44px system-ui, -apple-system, sans-serif';
  // Create text gradient for personality title
  const titleGrad = ctx.createLinearGradient(pad + 40, 0, pad + 40 + 500, 0);
  titleGrad.addColorStop(0, '#ffffff');
  titleGrad.addColorStop(0.5, personality.colorStart);
  titleGrad.addColorStop(1, personality.colorEnd);
  ctx.fillStyle = titleGrad;
  ctx.fillText(personality.title.toUpperCase(), pad + 40, pad + 175);

  // Vibe subtitle
  ctx.font = '500 20px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.fillText(`Vibe: ${personality.vibe}`, pad + 40, pad + 235);

  // Description paragraph
  ctx.font = '400 16px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
  const descWords = personality.desc.split(' ');
  let line = '';
  let lineY = pad + 275;
  const maxDescW = cardW - 80;
  
  for (let n = 0; n < descWords.length; n++) {
    const testLine = line + descWords[n] + ' ';
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxDescW && n > 0) {
      ctx.fillText(line, pad + 40, lineY);
      line = descWords[n] + ' ';
      lineY += 24;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, pad + 40, lineY);

  // Divider
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(pad + 40, pad + 360);
  ctx.lineTo(canvas.width - pad - 40, pad + 360);
  ctx.stroke();

  // 8. Draw Top Tracks Section (Left)
  const colY = pad + 390;
  const colW = (cardW - 120) / 2; // 290 approx
  
  ctx.font = 'bold 20px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = personality.colorStart;
  ctx.fillText('TOP TRACKS', pad + 40, colY);

  let itemY = colY + 45;
  const tracksToDraw = topTracks.slice(0, 3);
  
  for (let i = 0; i < tracksToDraw.length; i++) {
    const track = tracksToDraw[i];
    const albumArtUrl = track.album?.images?.[0]?.url;
    let artImg = null;
    if (albumArtUrl) {
      artImg = await loadImage(albumArtUrl);
    }

    const artSize = 65;
    const artX = pad + 40;
    
    // Draw art shadow
    ctx.shadowColor = 'rgba(0,0,0,0.4)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 4;

    if (artImg) {
      ctx.drawImage(artImg, artX, itemY, artSize, artSize);
    } else {
      // Art Placeholder
      drawRoundedRect(ctx, artX, itemY, artSize, artSize, 6, 'rgba(255,255,255,0.05)', 'rgba(255,255,255,0.1)');
      ctx.fillStyle = 'rgba(255,255,255,0.2)';
      ctx.beginPath();
      ctx.arc(artX + artSize / 2, itemY + artSize / 2, 10, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Reset shadow
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // Track text details
    const textX = artX + artSize + 15;
    ctx.font = 'bold 16px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = '#ffffff';
    
    // Truncate track name if too long
    let nameText = `${i + 1}. ${track.name}`;
    if (ctx.measureText(nameText).width > colW - 80) {
      while (ctx.measureText(nameText + '...').width > colW - 80 && nameText.length > 0) {
        nameText = nameText.substring(0, nameText.length - 1);
      }
      nameText += '...';
    }
    ctx.fillText(nameText, textX, itemY + 8);

    ctx.font = '500 14px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    let artistText = track.artists.map(a => a.name).join(', ');
    if (ctx.measureText(artistText).width > colW - 80) {
      while (ctx.measureText(artistText + '...').width > colW - 80 && artistText.length > 0) {
        artistText = artistText.substring(0, artistText.length - 1);
      }
      artistText += '...';
    }
    ctx.fillText(artistText, textX, itemY + 32);

    itemY += 85;
  }

  // 9. Draw Top Artists Section (Right)
  const col2X = canvas.width - pad - 40 - colW;
  ctx.font = 'bold 20px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = personality.colorEnd;
  ctx.fillText('TOP ARTISTS', col2X, colY);

  let artistY = colY + 45;
  const artistsToDraw = topArtists.slice(0, 3);

  for (let i = 0; i < artistsToDraw.length; i++) {
    const artist = artistsToDraw[i];
    const artistArtUrl = artist.images?.[0]?.url;
    let artImg = null;
    if (artistArtUrl) {
      artImg = await loadImage(artistArtUrl);
    }

    const artSize = 65;
    
    // Draw art shadow
    ctx.shadowColor = 'rgba(0,0,0,0.4)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 4;

    // Artists get round cards
    if (artImg) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(col2X + artSize/2, artistY + artSize/2, artSize/2, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(artImg, col2X, artistY, artSize, artSize);
      ctx.restore();
    } else {
      // Artist Placeholder
      drawRoundedRect(ctx, col2X, artistY, artSize, artSize, artSize/2, 'rgba(255,255,255,0.05)', 'rgba(255,255,255,0.1)');
      ctx.fillStyle = 'rgba(255,255,255,0.2)';
      ctx.font = 'bold 18px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(artist.name.charAt(0), col2X + artSize/2, artistY + artSize/2);
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
    }

    // Reset shadow
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // Artist details text
    const textX = col2X + artSize + 15;
    ctx.font = 'bold 16px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = '#ffffff';
    
    let artName = `${i + 1}. ${artist.name}`;
    if (ctx.measureText(artName).width > colW - 80) {
      while (ctx.measureText(artName + '...').width > colW - 80 && artName.length > 0) {
        artName = artName.substring(0, artName.length - 1);
      }
      artName += '...';
    }
    ctx.fillText(artName, textX, artistY + 8);

    ctx.font = '500 13px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    let genreText = artist.genres.slice(0, 2).join(', ');
    if (ctx.measureText(genreText).width > colW - 80) {
      while (ctx.measureText(genreText + '...').width > colW - 80 && genreText.length > 0) {
        genreText = genreText.substring(0, genreText.length - 1);
      }
      genreText += '...';
    }
    ctx.fillText(genreText, textX, artistY + 32);

    artistY += 85;
  }

  // Divider
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(pad + 40, pad + 670);
  ctx.lineTo(canvas.width - pad - 40, pad + 670);
  ctx.stroke();

  // 10. Draw Mood / Audio Features Radar Chart (Drawn programmatically using Canvas)
  const chartY = pad + 700;
  ctx.font = 'bold 20px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('AUDIO DNA', pad + 40, chartY);

  // Draw features as a list of bar indicators (perfect for clean canvas design without needing a full radar chart renderer)
  const featureList = [
    { label: 'ENERGY', val: moodScore.energy, desc: 'Beat intensity & noise' },
    { label: 'DANCEABILITY', val: moodScore.danceability, desc: 'Rhythmic suitability' },
    { label: 'HAPPINESS (VALENCE)', val: moodScore.valence, desc: 'Musical positivity' },
    { label: 'ACOUSTICNESS', val: moodScore.acousticness, desc: 'Organic instrumentation' },
  ];

  let barY = chartY + 45;
  const barMaxW = cardW - 80;

  featureList.forEach((feat) => {
    ctx.font = '600 14px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.fillText(feat.label, pad + 40, barY);

    ctx.font = '400 12px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    const valPercent = Math.round(feat.val * 100) + '%';
    ctx.fillText(feat.desc, pad + 40 + ctx.measureText(feat.label).width + 10, barY + 2);

    ctx.font = 'bold 14px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(valPercent, canvas.width - pad - 40 - ctx.measureText(valPercent).width, barY);

    // Draw bar background
    const trackY = barY + 22;
    drawRoundedRect(ctx, pad + 40, trackY, barMaxW, 8, 4, 'rgba(255,255,255,0.05)', null);

    // Draw active filled bar
    const filledW = barMaxW * feat.val;
    const barGrad = ctx.createLinearGradient(pad + 40, 0, pad + 40 + filledW, 0);
    barGrad.addColorStop(0, personality.colorStart);
    barGrad.addColorStop(1, personality.colorEnd);
    drawRoundedRect(ctx, pad + 40, trackY, filledW, 8, 4, barGrad, null);

    barY += 52;
  });

  // 11. Draw Footer / Spotify Soundwave code
  const footerY = pad + 940;
  
  // Draw divider
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(pad + 40, footerY);
  ctx.lineTo(canvas.width - pad - 40, footerY);
  ctx.stroke();

  // Draw decorative Soundwave Bar Code (mimicking Spotify Codes)
  const codeX = pad + 40;
  const codeY = footerY + 30;
  const codeW = cardW - 80;
  const codeH = 50;
  
  // Background container for wave
  drawRoundedRect(ctx, codeX, codeY, codeW, codeH, 12, 'rgba(255,255,255,0.02)', 'rgba(255,255,255,0.05)', 1);

  // Draw some custom vertical bars to simulate soundwave
  ctx.fillStyle = '#1DB954'; // Spotify green wave bars
  const numBars = 55;
  const barSpacing = (codeW - 40) / numBars;
  const waveHeights = [
    10, 15, 20, 10, 8, 15, 25, 35, 12, 8, 18, 22, 30, 25, 15, 8, 12, 28, 40, 30,
    18, 10, 22, 34, 38, 20, 12, 15, 25, 35, 30, 25, 10, 15, 22, 28, 38, 30, 18, 8,
    12, 24, 35, 25, 15, 10, 18, 28, 20, 12, 8, 15, 22, 12, 8
  ];

  ctx.save();
  ctx.translate(codeX + 20, codeY + codeH / 2);
  for (let b = 0; b < numBars; b++) {
    const h = waveHeights[b % waveHeights.length];
    // Draw rounded vertical line
    ctx.beginPath();
    ctx.moveTo(b * barSpacing, -h/2);
    ctx.lineTo(b * barSpacing, h/2);
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.strokeStyle = b % 2 === 0 ? personality.colorStart : '#ffffffd0';
    ctx.stroke();
  }
  ctx.restore();

  // Draw Scan Label
  ctx.font = '600 12px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.textAlign = 'center';
  ctx.fillText('SCAN TO EXPLORE YOUR VIBE', canvas.width / 2, footerY + 95);
  ctx.textAlign = 'left';
}

/**
 * Utility to download the canvas content as an image file
 */
export function downloadCanvas(canvas, filename = 'soundvibe-card.png') {
  const link = document.createElement('a');
  link.download = filename;
  link.href = canvas.toDataURL('image/png');
  link.click();
}
