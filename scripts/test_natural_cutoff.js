const sharp = require('sharp');

async function testFrames() {
  function getNaturalHeadCutoff(x) {
    if (x <= 180) return 605; // Full beard in all frames
    if (x <= 235) {
      // Jawline curve from beard (605) to under ear (515)
      const t = (x - 180) / 55;
      return Math.round(605 - t * 90);
    }
    if (x <= 275) {
      // Golden ring earring hangs to y=512
      return 515;
    }
    if (x <= 330) {
      // Neck contour behind earring, above any red collar
      const t = (x - 275) / 55;
      return Math.round(515 - t * 45); // 515 -> 470
    }
    if (x <= 450) {
      // Hair curls behind ear: 470 -> 520
      const t = (x - 330) / 120;
      return Math.round(470 + t * 50);
    }
    if (x <= 550) {
      // Hair curls mid-back: 520 -> 565
      const t = (x - 450) / 100;
      return Math.round(520 + t * 45);
    }
    // Back hair curls: 565 -> 610
    const t = Math.min(1, (x - 550) / 90);
    return Math.round(565 + t * 45);
  }

  const framesToTest = [0, 6, 12, 18, 24];

  for (const f of framesToTest) {
    const srcFile = `public/images/chewing/frame_${String(f).padStart(3, '0')}.webp`;
    const { data, info } = await sharp(srcFile).raw().toBuffer({ resolveWithObject: true });
    const W = info.width, H = info.height;

    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const idx = (y * W + x) * 4;
        const a = data[idx + 3];
        if (a === 0) continue;

        const r = data[idx], g = data[idx+1], b = data[idx+2];

        // 1. Remove ANY red/burgundy body cloth (r > 70, g < 50, b < 55) for x >= 220, y >= 440
        if (y >= 440 && x >= 220 && r > 70 && g < 50 && b < 55) {
          data[idx + 3] = 0;
          continue;
        }

        // 2. Remove shoulder skin behind neck: x >= 320, y >= 465, if skin tone (g > 60 and r > 80)
        if (y >= 465 && x >= 320 && r > 80 && g > 60) {
          data[idx + 3] = 0;
          continue;
        }

        // 3. Cutoff contour
        const cutoffY = getNaturalHeadCutoff(x);
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
      .toFile(`public/images/chewing_head/test_frame_${f}.png`);
  }

  console.log('Saved test frames 0, 6, 12, 18, 24');
}

testFrames();
