const sharp = require('sharp');

async function inspectHeadOnly() {
  const { data, info } = await sharp('public/images/eating/bakasur_head_only_transparent.png').raw().toBuffer({ resolveWithObject: true });
  console.log('Head only transparent info:', info);
  // check bottom most visible pixels
  for (let x = 0; x < info.width; x += 20) {
    let lowestY = -1;
    let color = '';
    for (let y = info.height - 1; y >= 0; y--) {
      const idx = (y * info.width + x) * 4;
      if (data[idx + 3] > 30) {
        lowestY = y;
        color = `rgb(${data[idx]},${data[idx+1]},${data[idx+2]})`;
        break;
      }
    }
    if (lowestY !== -1) {
      console.log(`x=${x}: lowestY=${lowestY} color=${color}`);
    }
  }
}

inspectHeadOnly();
