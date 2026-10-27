const sharp = require('sharp');

async function cleanHeadFinal() {
  const { data, info } = await sharp('public/images/eating/bakasur_head_only_transparent.png')
    .raw()
    .toBuffer({ resolveWithObject: true });

  const W = info.width;
  const H = info.height;

  // 1. Erase all text ASUR E: in top-left
  for (let y = 0; y < 140; y++) {
    for (let x = 0; x < 155; x++) {
      if (y < 75 && x > 180) continue; // horn
      if (y >= 75 && x > 150) continue; // horn/hair
      if (y >= 120 && x > 125) continue; // hair curls

      const idx = (y * W + x) * 4;
      data[idx] = 0;
      data[idx + 1] = 0;
      data[idx + 2] = 0;
      data[idx + 3] = 0;
    }
  }

  // 2. Erase everything in front of the mouth profile
  // In front of mouth (x < 96, y between 330 and 414): erase 100%!
  for (let y = 330; y <= 414; y++) {
    for (let x = 0; x < 96; x++) {
      const idx = (y * W + x) * 4;
      data[idx] = 0;
      data[idx + 1] = 0;
      data[idx + 2] = 0;
      data[idx + 3] = 0;
    }
  }

  // 3. For the remaining samosa corner at x: 96 to 105, y: 395 to 414:
  // Erase if golden/brown samosa color (r > 90, g > 35, b < 60)
  for (let y = 395; y <= 414; y++) {
    for (let x = 96; x <= 105; x++) {
      const idx = (y * W + x) * 4;
      const r = data[idx], g = data[idx+1], b = data[idx+2];
      if (r > 80 && g > 30 && b < 60) {
        data[idx] = 0;
        data[idx + 1] = 0;
        data[idx + 2] = 0;
        data[idx + 3] = 0;
      }
    }
  }

  // 4. Clean any remaining alpha < 20 noise in x < 100
  for (let y = 330; y < 425; y++) {
    for (let x = 0; x < 100; x++) {
      const idx = (y * W + x) * 4;
      if (data[idx + 3] < 30) {
        data[idx] = 0; data[idx+1] = 0; data[idx+2] = 0; data[idx+3] = 0;
      }
    }
  }

  await sharp(data, { raw: { width: W, height: H, channels: 4 } })
    .png()
    .toFile('public/images/eating/bakasur_head_only_transparent.png');

  console.log('Saved final clean bakasur_head_only_transparent.png');
}

cleanHeadFinal();
