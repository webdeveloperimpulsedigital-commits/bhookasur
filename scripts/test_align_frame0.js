const sharp = require('sharp');

async function testMouthComposite() {
  const scale = 0.51667;
  const f0W = Math.round(640 * scale); // 331
  const f0H = Math.round(800 * scale); // 413

  // Resize frame0
  const resizedF0 = await sharp('public/images/chewing/frame_000.webp')
    .resize(f0W, f0H)
    .png()
    .toBuffer();

  // Extract mouth region from resized frame 0:
  // Mouth in resized frame 0: x: 0 to 110, y: 160 to 300
  const mouthExtract = await sharp(resizedF0)
    .extract({ left: 0, top: 160, width: 110, height: 140 })
    .png()
    .toBuffer();

  // Placed at left: 78, top: 111 + 160 = 271 in 295x530 canvas
  await sharp({
    create: {
      width: 295,
      height: 530,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    }
  })
  .composite([
    {
      input: mouthExtract,
      left: 78,
      top: 271
    }
  ])
  .png()
  .toFile('public/images/eating/test_frame0_mouth_extracted.png');

  console.log('Saved test_frame0_mouth_extracted.png');
}

testMouthComposite();
