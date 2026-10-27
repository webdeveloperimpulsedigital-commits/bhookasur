const sharp = require('sharp');

async function testOverlay() {
  const base = await sharp('public/images/eating/test_clean_step1.png').toBuffer();
  const mouth = await sharp('public/images/eating/test_frame0_mouth_extracted.png').toBuffer();

  // Overlay mouth under or over base
  // Since base has transparent hole in mouth, putting mouth UNDER base
  // will seamlessly fill the mouth without covering any original face/hair!
  await sharp(mouth)
    .composite([
      {
        input: base,
        top: 0,
        left: 0
      }
    ])
    .png()
    .toFile('public/images/eating/test_mouth_composite.png');

  console.log('Saved test_mouth_composite.png');
}

testOverlay();
