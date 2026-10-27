const sharp = require('sharp');

async function test() {
  const svgCircle = `<svg width="50" height="50"><circle cx="25" cy="25" r="15" fill="#FF0055" opacity="0.85"/></svg>`;
  const circleBuf = await sharp(Buffer.from(svgCircle)).png().toBuffer();
  await sharp('public/images/chewing_head/frame_000.webp')
    .composite([{ input: circleBuf, left: 60 - 25, top: 445 - 25 }])
    .png()
    .toFile('public/images/chewing_head/test_mouth_calibrated.png');
  console.log('Saved calibrated mouth test');
}

test();
