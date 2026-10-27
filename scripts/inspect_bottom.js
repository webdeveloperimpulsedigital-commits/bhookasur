const sharp = require('sharp');

async function inspectBottomEdge() {
  const { data, info } = await sharp('public/images/chewing_head/frame_000.webp').raw().toBuffer({ resolveWithObject: true });
  const W = info.width;
  const H = info.height;

  console.log('Bottom-most visible pixel for each X column (every 20px):');
  for (let x = 0; x < W; x += 20) {
    let lowestY = -1;
    let color = '';
    for (let y = H - 1; y >= 0; y--) {
      const idx = (y * W + x) * 4;
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

inspectBottomEdge();
