const sharp = require('sharp');

async function inspectRealColors() {
  const { data, info } = await sharp('public/images/chewing/frame_000.webp').raw().toBuffer({ resolveWithObject: true });
  const W = info.width;

  console.log('Sampling actual RGB from x: 200 to 350 at y=450, 470, 490, 510, 530:');
  for (let y of [450, 470, 490, 510, 530]) {
    for (let x = 200; x <= 340; x += 20) {
      const idx = (y * W + x) * 4;
      console.log(`x=${x}, y=${y}: rgb(${data[idx]}, ${data[idx+1]}, ${data[idx+2]})`);
    }
  }
}

inspectRealColors();
