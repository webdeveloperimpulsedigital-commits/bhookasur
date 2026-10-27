const sharp = require('sharp');

async function testPhotorealMouth() {
  const s = 0.56;
  const sW = Math.round(640 * s); // 358
  const sH = Math.round(800 * s); // 448
  const left = 85;
  const top = 101;

  const resized = await sharp('public/images/chewing/frame_000.webp')
    .resize(sW, sH)
    .png()
    .toBuffer();

  await sharp({
    create: {
      width: 500,
      height: 650,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    }
  })
  .composite([
    {
      input: resized,
      left: left,
      top: top
    }
  ])
  .extract({ left: 0, top: 0, width: 295, height: 530 })
  .png()
  .toFile('public/images/eating/test_frame0_in_head_coords.png');

  console.log('Saved test_frame0_in_head_coords.png');
}

testPhotorealMouth();
