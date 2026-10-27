const sharp = require('sharp');

async function inspectSamosa() {
  const { data, info } = await sharp('public/images/eating/bakasur_head_only_transparent.png')
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height } = info;

  // Let's find all pixels of the samosa:
  // Samosa is on the left of his face, between X: 0 to 120, Y: 320 to 420.
  // Let's inspect the bounding box of pixels in this region that have color matching the samosa (golden/tan) vs the text ASUR E:.
  console.log('Inspecting X: 0-120, Y: 320-420');

  let minX = width, maxX = 0, minY = height, maxY = 0;
  for (let y = 320; y < 420; y++) {
    for (let x = 0; x < 120; x++) {
      const idx = (y * width + x) * 4;
      const a = data[idx + 3];
      if (a > 30) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  console.log(`Region bounds: X=[${minX}, ${maxX}], Y=[${minY}, ${maxY}]`);
}

inspectSamosa();
