const sharp = require('sharp');

async function createCleanHead() {
  // 1. Load bakasur_head_only_transparent.png
  const headMeta = await sharp('public/images/eating/bakasur_head_only_transparent.png').metadata();
  const { data: headData, info: headInfo } = await sharp('public/images/eating/bakasur_head_only_transparent.png')
    .raw()
    .toBuffer({ resolveWithObject: true });

  const W = headInfo.width; // 295
  const H = headInfo.height; // 530

  // 2. Erase the top-left text "ASUR \n E:"
  // In X < 135 and Y < 135
  for (let y = 0; y < 135; y++) {
    for (let x = 0; x < 135; x++) {
      const idx = (y * W + x) * 4;
      headData[idx] = 0;
      headData[idx + 1] = 0;
      headData[idx + 2] = 0;
      headData[idx + 3] = 0;
    }
  }

  // 3. Erase all pixels of the floating samosa and speedlines (X < 112, Y: 330 to 420)
  // Let's check where the upper mustache and teeth start vs the samosa
  for (let y = 330; y < 420; y++) {
    for (let x = 0; x < 105; x++) {
      const idx = (y * W + x) * 4;
      headData[idx] = 0;
      headData[idx + 1] = 0;
      headData[idx + 2] = 0;
      headData[idx + 3] = 0;
    }
  }

  await sharp(headData, { raw: { width: W, height: H, channels: 4 } })
    .png()
    .toFile('public/images/eating/test_clean_step1.png');

  console.log('Saved test_clean_step1.png');
}

createCleanHead();
