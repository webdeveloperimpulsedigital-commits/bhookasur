const sharp = require('sharp');

async function testHeadOnlyClean() {
  const { data, info } = await sharp('public/images/chewing/frame_000.webp').raw().toBuffer({ resolveWithObject: true });
  const W = info.width; // 640
  const H = info.height; // 800

  // Pure head-only cutoff:
  function getHeadCutoff(x) {
    if (x <= 180) return 595; // Full beard
    if (x <= 235) {
      // Jawline curve from beard (595) to under ear (475)
      const t = (x - 180) / 55;
      return Math.round(595 - t * 120);
    }
    if (x <= 270) {
      // Ear and gold ring earring: earring hangs to 505
      return 506;
    }
    if (x <= 320) {
      // Under ear neck line above red collar: 460
      const t = (x - 270) / 50;
      return Math.round(506 - t * 46); // 506 -> 460
    }
    if (x <= 420) {
      // Hair curls behind ear: 460 -> 485
      const t = (x - 320) / 100;
      return Math.round(460 + t * 25);
    }
    if (x <= 520) {
      // Hair curls: 485 -> 515
      const t = (x - 420) / 100;
      return Math.round(485 + t * 30);
    }
    // Back hair curls: 515 -> 545
    const t = Math.min(1, (x - 520) / 100);
    return Math.round(515 + t * 30);
  }

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const idx = (y * W + x) * 4;
      const r = data[idx], g = data[idx+1], b = data[idx+2], a = data[idx+3];
      if (a === 0) continue;

      // 1. Remove ANY red/maroon body cloth under neck/ear:
      // Red cloth: vibrant red, low green, low blue
      if (y >= 435 && x >= 230 && r > 70 && (r - g > 35) && (r - b > 35)) {
        data[idx + 3] = 0;
        continue;
      }

      // 2. Remove shoulder skin:
      // At x >= 330 and y >= 460: if it's skin (not dark hair), erase!
      // Hair is dark: r < 60 && g < 60 && b < 60
      if (x >= 330 && y >= 460 && (r > 80 || g > 60)) {
        data[idx + 3] = 0;
        continue;
      }

      // 3. Cutoff contour
      const cutoffY = getHeadCutoff(x);
      if (y > cutoffY) {
        const dist = y - cutoffY;
        if (dist > 8) {
          data[idx + 3] = 0;
        } else {
          const factor = 0.5 * (1 + Math.cos(Math.PI * (dist / 8)));
          data[idx + 3] = Math.round(data[idx + 3] * factor);
        }
      }
    }
  }

  await sharp(data, { raw: { width: W, height: H, channels: 4 } })
    .png()
    .toFile('public/images/chewing_head/test_pure_head.png');

  console.log('Saved test_pure_head.png');
}

testHeadOnlyClean();
