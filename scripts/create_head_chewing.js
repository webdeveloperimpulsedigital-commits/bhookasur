const sharp = require('sharp');
const fs = require('fs');

async function createHeadOnlyChewingFrames() {
  const outDir = 'public/images/chewing_head';
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  // Smooth neck contour:
  // x <= 180: Y = 548 (bottom of beard)
  // x: 180 -> 240: slopes from 548 to 505 (neck curve under earring)
  // x: 240 -> 340: Y = 500 (neck skin above scarf)
  // x: 340 -> 500: slopes from 500 to 480 (hair above shoulder)
  // x > 500: Y = 460 (back hair)
  function getCutoff(x) {
    if (x <= 180) return 548;
    if (x <= 240) return 548 - ((x - 180) / 60) * 43; // 548 -> 505
    if (x <= 340) return 505 - ((x - 240) / 100) * 5;  // 505 -> 500
    if (x <= 500) return 500 - ((x - 340) / 160) * 20; // 500 -> 480
    return 480 - ((x - 500) / 140) * 25; // 480 -> 455
  }

  for (let i = 0; i <= 24; i++) {
    const srcFile = `public/images/chewing/frame_${String(i).padStart(3, '0')}.webp`;
    if (!fs.existsSync(srcFile)) continue;

    const { data, info } = await sharp(srcFile).raw().toBuffer({ resolveWithObject: true });
    const W = info.width; // 640
    const H = info.height; // 800

    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const cutoffY = getCutoff(x);
        if (y > cutoffY) {
          const idx = (y * W + x) * 4;
          const dist = y - cutoffY;
          if (dist > 8) {
            data[idx + 3] = 0;
          } else {
            const alphaFactor = (8 - dist) / 8;
            data[idx + 3] = Math.round(data[idx + 3] * alphaFactor);
          }
        }
      }
    }

    // Crop height to 555px
    await sharp(data, { raw: { width: W, height: H, channels: 4 } })
      .extract({ left: 0, top: 0, width: 640, height: 555 })
      .webp({ quality: 90 })
      .toFile(`${outDir}/frame_${String(i).padStart(3, '0')}.webp`);
  }

  console.log('Successfully updated head-only frames with clean neck contour!');
}

createHeadOnlyChewingFrames();
