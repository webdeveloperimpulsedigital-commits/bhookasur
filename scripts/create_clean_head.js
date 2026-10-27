const sharp = require('sharp');

async function createCleanOpenMouth() {
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

  // 2. Erase the samosa and all speedlines
  // In front of the face:
  // Upper mustache starts around x: 80-90 at y: 310-345
  // Upper teeth are at x: 92-110 at y: 348-362
  // Lower teeth/lip are at x: 92-110 at y: 400-415
  // Beard is at x > 85 for y > 415
  // Mouth opening is between y: 362 and y: 400!
  for (let y = 330; y < 430; y++) {
    for (let x = 0; x < W; x++) {
      const idx = (y * W + x) * 4;
      const a = data[idx + 3];
      if (a < 20) continue;

      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];

      // Erase any speedline or stray samosa in the air
      if (x < 85) {
        data[idx] = 0; data[idx+1] = 0; data[idx+2] = 0; data[idx+3] = 0;
        continue;
      }

      // Upper mustache: y <= 347. Keep mustache hair (dark or skin)
      if (y <= 347) {
        continue;
      }

      // Lower lip / beard: y >= 402. Keep lip and beard
      if (y >= 402) {
        continue;
      }

      // Inside mouth opening (y between 348 and 401):
      // If it's upper teeth (y <= 362 and bright white/teeth color):
      if (y <= 362 && r > 165 && g > 160 && b > 145) {
        continue; // keep upper teeth!
      }

      // If it's the samosa:
      // Golden fried samosa color: (r > 140, g > 85, b < 90, r > g)
      const isSamosa = (r > 130 && g > 75 && b < 85 && (r - g) > 25);

      if (isSamosa) {
        // If it's outside the mouth cavity (x < 105), it's the samosa in air -> transparent!
        if (x < 105) {
          data[idx] = 0;
          data[idx + 1] = 0;
          data[idx + 2] = 0;
          data[idx + 3] = 0;
        } else {
          // Inside mouth (x >= 105): fill with natural deep mouth interior
          // Sample color from real throat cavity at (x: 125, y: y)
          const refIdx = (y * W + 125) * 4;
          data[idx] = data[refIdx] || 120;
          data[idx + 1] = data[refIdx + 1] || 25;
          data[idx + 2] = data[refIdx + 2] || 35;
          data[idx + 3] = 255;
        }
      }
    }
  }

  // Smooth blur on the filled mouth cavity (x: 104 to 122, y: 360 to 398)
  for (let y = 363; y <= 396; y++) {
    for (let x = 104; x <= 118; x++) {
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

  console.log('Saved pristine bakasur_head_only_transparent.png');
}

createCleanOpenMouth();
