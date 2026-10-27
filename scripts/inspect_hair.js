const sharp = require('sharp');

async function inspectHair() {
  const { data, info } = await sharp('public/images/chewing/frame_000.webp').raw().toBuffer({ resolveWithObject: true });
  const W = info.width;
  const H = info.height;

  // Find hair pixels (dark: r < 55, g < 55, b < 55) for x > 300, y from 400 to 700
  console.log('Hair boundary on the right/back (x > 300):');
  for (let x = 320; x <= 620; x += 30) {
    let lowestHairY = -1;
    let highestHairY = -1;
    for (let y = 100; y < 750; y++) {
      const idx = (y * W + x) * 4;
      const r = data[idx], g = data[idx+1], b = data[idx+2], a = data[idx+3];
      if (a > 50 && r < 60 && g < 60 && b < 60) {
        if (highestHairY === -1) highestHairY = y;
        lowestHairY = y;
      }
    }
    console.log(`x=${x}: hair top=${highestHairY}, lowestHairY=${lowestHairY}`);
  }
}

inspectHair();
