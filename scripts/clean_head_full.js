const sharp = require('sharp');

async function cleanHead() {
  const { data, info } = await sharp('public/images/eating/bakasur_head_only_transparent.png')
    .raw()
    .toBuffer({ resolveWithObject: true });

  const W = info.width; // 295
  const H = info.height; // 530

  // 1. Erase all pixels in top-left (ASUR E: text and stray blue strokes)
  // Horn starts around x > 150, y > 0, hair starts around x > 130, y > 120
  for (let y = 0; y < 135; y++) {
    for (let x = 0; x < 155; x++) {
      // Keep horn: horn tip is at x > 200 for y < 100
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

  // 2. Erase samosa and speedlines on the left
  // Between Y: 330 and 420, any pixel with x < 100 is completely erased
  for (let y = 330; y < 420; y++) {
    for (let x = 0; x < 102; x++) {
      const idx = (y * W + x) * 4;
      data[idx] = 0;
      data[idx + 1] = 0;
      data[idx + 2] = 0;
      data[idx + 3] = 0;
    }
  }

  // 3. For the samosa tip inside the mouth:
  // Samosa tip is at x: 102 to 118, y: 360 to 395
  // Samosa pixels have yellowish/orange/tan color: R > 150, G > 90, B < 80, R > G
  // Mouth interior pixels have red/dark red color: R > 90, G < 60, B < 60
  // If a pixel is in this samosa tip zone and is samosa-colored, replace with mouth cavity color (dark red/pink)
  for (let y = 360; y < 398; y++) {
    for (let x = 100; x < 122; x++) {
      const idx = (y * W + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const a = data[idx + 3];

      if (a > 30) {
        // Is it samosa color?
        // Samosa: golden yellow-brown
        if (g > 75 && r > 130 && b < 80) {
          // Replace with mouth interior color
          // Sample mouth cavity color from adjacent mouth interior (e.g. x=125, same y)
          const mouthIdx = (y * W + 125) * 4;
          data[idx] = data[mouthIdx] || 155;
          data[idx + 1] = data[mouthIdx + 1] || 35;
          data[idx + 2] = data[mouthIdx + 2] || 45;
          data[idx + 3] = 255;
        }
      }
    }
  }

  // Also clean any stray dark blue fringe on the mouth opening if needed
  await sharp(data, { raw: { width: W, height: H, channels: 4 } })
    .png()
    .toFile('public/images/eating/bakasur_head_only_transparent_clean.png');

  console.log('Saved bakasur_head_only_transparent_clean.png');
}

cleanHead();
