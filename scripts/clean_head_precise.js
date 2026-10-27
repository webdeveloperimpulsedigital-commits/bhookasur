const sharp = require('sharp');

async function cleanSamosaPrecise() {
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

  // 2. Erase everything in front of the mouth profile (x < 92)
  for (let y = 330; y < 425; y++) {
    for (let x = 0; x < 92; x++) {
      const idx = (y * W + x) * 4;
      data[idx] = 0;
      data[idx + 1] = 0;
      data[idx + 2] = 0;
      data[idx + 3] = 0;
    }
  }

  // 3. For the mouth entrance (x: 92 to 125, y: 340 to 420):
  // Keep:
  // - Mustache: y < 355, dark pixels (r < 70, g < 70, b < 70)
  // - Upper Teeth: y: 348 to 365, white pixels (r > 170, g > 165, b > 150)
  // - Lower Lip & Beard: y >= 402, pink lip / black beard
  // - Tongue: at the bottom of the mouth (y: 395 to 405, x: 105 to 135)
  // - Throat back wall: x > 120
  // Everything else in the mouth opening (y: 360 to 395, x: 92 to 120):
  // It's the open mouth cavity! The samosa tip was here.
  // We fill the mouth cavity with smooth natural mouth interior gradient
  // (deep dark crimson/red throat: #7a151e to #99222c)
  for (let y = 358; y <= 396; y++) {
    for (let x = 92; x <= 122; x++) {
      const idx = (y * W + x) * 4;
      
      // If it's upper teeth (y <= 365 and bright white), keep teeth
      const r = data[idx], g = data[idx+1], b = data[idx+2];
      if (y <= 365 && r > 180 && g > 175 && b > 160) {
        continue;
      }
      
      // If x < 98 and it's not teeth, it's open air in front of mouth -> transparent!
      if (x < 98) {
        data[idx] = 0;
        data[idx + 1] = 0;
        data[idx + 2] = 0;
        data[idx + 3] = 0;
        continue;
      }

      // x >= 98: inside the mouth cavity
      // Calculate realistic mouth depth: darker towards right (deeper in throat)
      const depthRatio = (x - 98) / 24; // 0 at mouth opening, 1 deep inside
      const cavityR = Math.round(145 - depthRatio * 45); // 145 -> 100
      const cavityG = Math.round(38 - depthRatio * 15);   // 38 -> 23
      const cavityB = Math.round(48 - depthRatio * 18);   // 48 -> 30

      data[idx] = cavityR;
      data[idx + 1] = cavityG;
      data[idx + 2] = cavityB;
      data[idx + 3] = 255;
    }
  }

  // Smooth blur on the filled mouth cavity (x: 98 to 122, y: 358 to 396)
  for (let y = 360; y <= 394; y++) {
    for (let x = 99; x <= 120; x++) {
      const idx = (y * W + x) * 4;
      let sr = 0, sg = 0, sb = 0, sc = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nIdx = ((y + dy) * W + (x + dx)) * 4;
          if (data[nIdx + 3] > 100) {
            sr += data[nIdx];
            sg += data[nIdx + 1];
            sb += data[nIdx + 2];
            sc++;
          }
        }
      }
      if (sc > 0) {
        data[idx] = Math.round(sr / sc);
        data[idx + 1] = Math.round(sg / sc);
        data[idx + 2] = Math.round(sb / sc);
      }
    }
  }

  await sharp(data, { raw: { width: W, height: H, channels: 4 } })
    .png()
    .toFile('public/images/eating/bakasur_head_only_transparent_clean.png');

  console.log('Saved updated clean head');
}

cleanSamosaPrecise();
