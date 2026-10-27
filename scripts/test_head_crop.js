const sharp = require('sharp');

async function testHeadOnlyCrop() {
  // Let's crop frame_000, frame_006, frame_012 to head-only
  // Height from 0 to 570
  // Let's also see if we can do a smooth transparent fade at the neck or curved cutout
  const meta = await sharp('public/images/chewing/frame_000.webp').metadata();
  console.log('Original frame size:', meta.width, 'x', meta.height);

  // Extract from 0,0 with width: 640, height: 570
  await sharp('public/images/chewing/frame_000.webp')
    .extract({ left: 0, top: 0, width: 640, height: 570 })
    .png()
    .toFile('public/images/chewing/test_head_crop_000.png');

  await sharp('public/images/chewing/frame_006.webp')
    .extract({ left: 0, top: 0, width: 640, height: 570 })
    .png()
    .toFile('public/images/chewing/test_head_crop_006.png');

  await sharp('public/images/chewing/frame_012.webp')
    .extract({ left: 0, top: 0, width: 640, height: 570 })
    .png()
    .toFile('public/images/chewing/test_head_crop_012.png');

  console.log('Saved test head crops');
}

testHeadOnlyCrop();
