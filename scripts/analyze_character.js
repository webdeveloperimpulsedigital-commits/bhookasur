const sharp = require('sharp');

async function analyze() {
  const { data, info } = await sharp('public/images/chewing/frame_000.webp').raw().toBuffer({ resolveWithObject: true });
  const W = info.width;
  const H = info.height;

  // Let's find:
  // 1. Nose tip:
  // 2. Earring:
  // 3. Mouth cavity:
  // 4. Chin / Beard bottom:
  // 5. Hair contour:
  // 6. Where the red cloth is:

  console.log('Image dimensions:', W, H);

  // Red cloth detection:
  let redMinX = W, redMaxX = 0, redMinY = H, redMaxY = 0;
  let redCount = 0;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const idx = (y * W + x) * 4;
      const r = data[idx], g = data[idx+1], b = data[idx+2], a = data[idx+3];
      if (a > 50 && r > 100 && r > g * 1.8 && r > b * 1.8) {
        redCount++;
        if (x < redMinX) redMinX = x;
        if (x > redMaxX) redMaxX = x;
        if (y < redMinY) redMinY = y;
        if (y > redMaxY) redMaxY = y;
      }
    }
  }
  console.log(`Red cloth: count=${redCount}, x=[${redMinX}, ${redMaxX}], y=[${redMinY}, ${redMaxY}]`);

  // Earring detection (gold: r > 180, g > 140, b < 90):
  let goldMinX = W, goldMaxX = 0, goldMinY = H, goldMaxY = 0;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const idx = (y * W + x) * 4;
      const r = data[idx], g = data[idx+1], b = data[idx+2], a = data[idx+3];
      if (a > 100 && r > 180 && g > 130 && b < 80) {
        if (x < goldMinX) goldMinX = x;
        if (x > goldMaxX) goldMaxX = x;
        if (y < goldMinY) goldMinY = y;
        if (y > goldMaxY) goldMaxY = y;
      }
    }
  }
  console.log(`Gold earring: x=[${goldMinX}, ${goldMaxX}], y=[${goldMinY}, ${goldMaxY}]`);

  // Find lowest beard pixel (x around 50 to 200)
  let beardMaxY = 0;
  for (let x = 50; x <= 200; x++) {
    for (let y = 400; y < 650; y++) {
      const idx = (y * W + x) * 4;
      const r = data[idx], g = data[idx+1], b = data[idx+2], a = data[idx+3];
      // beard is dark
      if (a > 100 && r < 50 && g < 50 && b < 50) {
        if (y > beardMaxY) beardMaxY = y;
      }
    }
  }
  console.log('Beard lowest Y:', beardMaxY);
}

analyze();
