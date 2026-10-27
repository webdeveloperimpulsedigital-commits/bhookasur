const sharp = require('sharp');

async function extractMouth() {
  // Let's find mouth in frame_000.webp
  // In frame_000.webp (640x800), where is the mouth?
  // Let's extract around x: 50, y: 350, w: 200, h: 250
  await sharp('public/images/chewing/frame_000.webp')
    .extract({ left: 10, top: 300, width: 220, height: 280 })
    .png()
    .toFile('public/images/eating/mouth_from_frame0.png');

  console.log('Saved mouth_from_frame0.png');
}

extractMouth();
