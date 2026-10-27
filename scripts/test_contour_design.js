const sharp = require('sharp');

async function testContourDesign() {
  const { data, info } = await sharp('public/images/chewing/frame_000.webp').raw().toBuffer({ resolveWithObject: true });
  const W = info.width; // 640
  const H = info.height; // 800

  // We want to keep:
  // 1. Face / Horn / Hair / Beard / Ear / Earring
  // 2. Remove:
  //    - ANY red cloth: r > 80 && g < 50 && b < 55 at y > 430
  //    - Any body below jaw / beard / hair
  // Let's trace the boundary:
  // For x <= 180: Beard. Full beard in frame 0 goes to y ~ 595.
  // For x 180 to 240: Jawline sloping from beard (595) up to under ear (495).
  // For x 240 to 300: Under ear/earring. Earring ends at 510, skin at 480. Cutoff around 495 (keeps earring, removes neck/cloth).
  // For x 300 to 450: Under hair curls. Hair curls bottom is around 490 to 525.
  // For x 450 to 550: Hair curls bottom around 520 to 560.
  // For x 550 to 640: Hair curls tapering to back around 560 to 590.
  
  function getNaturalCutoff(x) {
    if (x <= 180) return 595; // full beard!
    if (x <= 240) {
      // Slopes from 595 down to 495 under the earring
      const t = (x - 180) / 60;
      return Math.round(595 - t * 100);
    }
    if (x <= 300) {
      // Under earring (earring hangs to 505)
      return 505;
    }
    if (x <= 420) {
      // Under hair curls behind ear
      const t = (x - 300) / 120;
      return Math.round(495 + t * 25); // 495 -> 520
    }
    if (x <= 540) {
      // Hair curls mid-back
      const t = (x - 420) / 120;
      return Math.round(520 + t * 35); // 520 -> 555
    }
    // Far back hair curls
    const t = Math.min(1, (x - 540) / 100);
    return Math.round(555 + t * 35); // 555 -> 590
  }

  // Also remove ANY red cloth at y > 440:
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const idx = (y * W + x) * 4;
      const r = data[idx], g = data[idx+1], b = data[idx+2], a = data[idx+3];
      if (a === 0) continue;

      // Check red cloth:
      if (y >= 440 && x >= 230 && r > 75 && g < 48 && b < 52) {
        data[idx + 3] = 0;
        continue;
      }

      const cutoffY = getNaturalCutoff(x);
      if (y > cutoffY) {
        const dist = y - cutoffY;
        if (dist > 10) {
          data[idx + 3] = 0;
        } else {
          const factor = 0.5 * (1 + Math.cos(Math.PI * (dist / 10)));
          data[idx + 3] = Math.round(data[idx + 3] * factor);
        }
      }
    }
  }

  await sharp(data, { raw: { width: W, height: H, channels: 4 } })
    .png()
    .toFile('public/images/chewing_head/test_clean_face_only.png');

  console.log('Saved test_clean_face_only.png');
}

testContourDesign();
