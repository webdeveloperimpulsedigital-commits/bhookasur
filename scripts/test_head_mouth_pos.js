const sharp = require('sharp');

async function testHeadMouthPos() {
  const meta = await sharp('public/images/chewing_head/frame_000.webp').metadata();
  console.log('Chewing head meta:', meta.width, 'x', meta.height);

  // In 640 x 555:
  // Mouth center in frame_000 is around x = 70, y = 460
  // top % = 460 / 555 = 82.88%
  // left % = 70 / 640 = 10.94%
  console.log('top %:', (460 / 555 * 100).toFixed(1) + '%');
  console.log('left %:', (70 / 640 * 100).toFixed(1) + '%');

  // Let's create an overlay test image
  const svgCircle = `<svg width="50" height="50">
    <circle cx="25" cy="25" r="20" fill="red" opacity="0.8"/>
  </svg>`;
  const circleBuf = await sharp(Buffer.from(svgCircle)).png().toBuffer();

  await sharp('public/images/chewing_head/frame_000.webp')
    .composite([
      {
        input: circleBuf,
        left: 70 - 25,
        top: 460 - 25
      }
    ])
    .png()
    .toFile('public/images/chewing_head/test_mouth_circle.png');

  console.log('Saved test_mouth_circle.png');
}

testHeadMouthPos();
