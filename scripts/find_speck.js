const sharp = require('sharp');

async function findSpeck() {
  const { data, info } = await sharp('public/images/eating/bakasur_head_only_transparent.png')
    .raw()
    .toBuffer({ resolveWithObject: true });

  const W = info.width;
  for (let y = 330; y < 425; y++) {
    for (let x = 0; x < 104; x++) {
      const idx = (y * W + x) * 4;
      if (data[idx + 3] > 0) {
        console.log(`Non-transparent at x=${x}, y=${y}, rgba=(${data[idx]},${data[idx+1]},${data[idx+2]},${data[idx+3]})`);
      }
    }
  }
}

findSpeck();
