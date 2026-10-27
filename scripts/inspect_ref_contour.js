const sharp = require('sharp');

async function inspectReferenceContour() {
  const { data, info } = await sharp('public/images/eating/bakasur_head_only_transparent.png').raw().toBuffer({ resolveWithObject: true });
  const W = info.width;
  const H = info.height;

  console.log(`Reference image W=${W}, H=${H}`);
  console.log('X coords, top Y, bottom Y:');
  for (let x = 0; x < W; x += 15) {
    let topY = -1, botY = -1;
    for (let y = 0; y < H; y++) {
      if (data[(y * W + x) * 4 + 3] > 30) {
        if (topY === -1) topY = y;
        botY = y;
      }
    }
    if (topY !== -1) {
      console.log(`x=${x}: topY=${topY}, botY=${botY}, span=${botY - topY}`);
    }
  }
}

inspectReferenceContour();
