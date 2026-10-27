const sharp = require('sharp');

async function cleanHeadV2() {
  const { data, info } = await sharp('public/images/eating/bakasur_head_only_transparent.png')
    .raw()
    .toBuffer({ resolveWithObject: true });

  const W = info.width; // 295
  const H = info.height; // 530

  // 1. Erase all text ASUR E: in top-left (ONLY in x < 155, y < 140)
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

  // 2. Erase samosa and air artifacts (STRICTLY X <= 120, Y between 330 and 420)
  // NEVER touch x > 125, so face, beard, earring are 100% preserved!
  for (let y = 330; y < 420; y++) {
    for (let x = 0; x <= 125; x++) {
      const idx = (y * W + x) * 4;
      if (data[idx + 3] < 15) continue;

      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];

      // Any pixel with x < 85 is in empty air -> erase!
      if (x < 85) {
        data[idx] = 0; data[idx+1] = 0; data[idx+2] = 0; data[idx+3] = 0;
        continue;
      }

      // Upper mustache: y <= 352. Keep mustache hair!
      if (y <= 352) {
        continue;
      }

      // Upper teeth: y between 353 and 363. Keep if it's white teeth (r>165, g>160, b>145)
      if (y >= 353 && y <= 363 && r > 165 && g > 160 && b > 145) {
        continue;
      }

      // Lower lip / lower teeth / beard: y >= 399. Keep!
      if (y >= 399) {
        continue;
      }

      // Now we are strictly inside the mouth opening: y between 358 and 398!
      // In this vertical range:
      // Front of mouth entrance (x < 104): make completely transparent (air!)
      if (x < 104) {
        data[idx] = 0;
        data[idx + 1] = 0;
        data[idx + 2] = 0;
        data[idx + 3] = 0;
        continue;
      }

      // Inside throat cavity (x >= 108 and x <= 125):
      // If it was samosa or samosa tip (golden or dark brown outline),
      // replace with real throat cavity color sampled from x=126
      const refIdx = (y * W + 126) * 4;
      // If pixel is yellowish (samosa) or outline (dark brown)
      if ((r > 120 && g > 70 && b < 90) || (r < 90 && g < 50 && b < 50)) {
        data[idx] = data[refIdx];
        data[idx + 1] = data[refIdx + 1];
        data[idx + 2] = data[refIdx + 2];
        data[idx + 3] = 255;
      }
    }
  }

  // Subtle blur on mouth cavity seam (x: 106 to 118, y: 360 to 396)
  for (let y = 360; y <= 396; y++) {
    for (let x = 108; x <= 118; x++) {
      const idx = (y * W + x) * 4;
      if (data[idx + 3] > 0) {
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
  }

  await sharp(data, { raw: { width: W, height: H, channels: 4 } })
    .png()
    .toFile('public/images/eating/bakasur_head_only_transparent.png');

  console.log('Saved clean head to bakasur_head_only_transparent.png');
}

cleanHeadV2();
