const sharp = require('sharp');
const fs = require('fs');

async function generateCleanHeadFrames() {
  const outDir = 'public/images/chewing_head';
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  function getNaturalHeadCutoff(x) {
    if (x <= 180) return 605; // Full beard across all frames
    if (x <= 230) {
      // Jawline curve from beard (605) to under ear (515)
      const t = (x - 180) / 50;
      return Math.round(605 - t * 90);
    }
    if (x <= 265) {
      // Golden ring earring (x: 225 to 265, hangs to y=512)
      return 515;
    }
    if (x <= 280) {
      // Curve under earring up to neck contour: 515 -> 465
      const t = (x - 265) / 15;
      return Math.round(515 - t * 50);
    }
    if (x <= 330) {
      // Neck contour behind earring, strictly above any red collar
      return 465;
    }
    if (x <= 450) {
      // Hair curls behind ear: 465 -> 515
      const t = (x - 330) / 120;
      return Math.round(465 + t * 50);
    }
    if (x <= 550) {
      // Hair curls mid-back: 515 -> 560
      const t = (x - 450) / 100;
      return Math.round(515 + t * 45);
    }
    // Back hair curls: 560 -> 605
    const t = Math.min(1, (x - 550) / 90);
    return Math.round(560 + t * 45);
  }

  console.log('Generating 25 clean head chewing frames...');

  for (let i = 0; i <= 24; i++) {
    const srcFile = `public/images/chewing/frame_${String(i).padStart(3, '0')}.webp`;
    if (!fs.existsSync(srcFile)) {
      console.warn('Missing:', srcFile);
      continue;
    }

    const { data, info } = await sharp(srcFile).raw().toBuffer({ resolveWithObject: true });
    const W = info.width; // 640
    const H = info.height; // 800

    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const idx = (y * W + x) * 4;
        const a = data[idx + 3];
        if (a === 0) continue;

        const r = data[idx], g = data[idx + 1], b = data[idx + 2];

        // 1. Remove ANY red/burgundy body cloth (scarf/shirt):
        if (y >= 435 && x >= 220 && r > 90 && g < 60 && (r - g > 35) && (r - b > 20)) {
          data[idx + 3] = 0;
          continue;
        }

        // 2. Remove shoulder skin behind neck:
        if (y >= 465 && x >= 320 && r > 80 && g > 60) {
          data[idx + 3] = 0;
          continue;
        }

        // 3. Cutoff contour with smooth cosine feathering
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

    // Extract exact 640 x 615 head-only canvas (removes empty bottom 185px)
    await sharp(data, { raw: { width: W, height: H, channels: 4 } })
      .extract({ left: 0, top: 0, width: 640, height: 615 })
      .webp({ quality: 95 })
      .toFile(`${outDir}/frame_${String(i).padStart(3, '0')}.webp`);
  }

  console.log('All 25 clean head frames generated successfully in public/images/chewing_head/');
}

generateCleanHeadFrames();
