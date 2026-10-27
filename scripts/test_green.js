const sharp = require('sharp');

async function testMouthAccurate() {
  const svgCircle = `<svg width="50" height="50">
    <circle cx="25" cy="25" r="20" fill="green" opacity="0.8"/>
  </svg>`;
  const circleBuf = await sharp(Buffer.from(svgCircle)).png().toBuffer();

  // Test x=90, y=415
  await sharp('public/images/chewing_head/frame_000.webp')
    .composite([
      {
        input: circleBuf,
        left: 90 - 25,
        top: 415 - 25
      }
    ])
    .png()
    .toFile('public/images/chewing_head/test_mouth_green.png');

  console.log('Saved test_mouth_green.png');
}

testMouthAccurate();
