const sharp = require('sharp');

async function check() {
  const { data, info } = await sharp('public/images/chewing_head/frame_000.webp').raw().toBuffer({ resolveWithObject: true });
  console.log('chewing_head/frame_000.webp:');
  for (let y = 440; y <= 540; y += 20) {
    for (let x = 200; x <= 450; x += 50) {
      const idx = (y * info.width + x) * 4;
      console.log(`x=${x}, y=${y}: rgba(${data[idx]},${data[idx+1]},${data[idx+2]},${data[idx+3]})`);
    }
  }

  // Check what non-transparent pixels exist at the bottom
  console.log('\nBottom rows with non-zero alpha:');
  for (let y = 450; y < 800; y += 20) {
    let nonZero = 0;
    for (let x = 0; x < info.width; x++) {
      if (data[(y * info.width + x) * 4 + 3] > 20) nonZero++;
    }
    console.log(`y=${y}: ${nonZero} visible pixels`);
  }
}

check();
