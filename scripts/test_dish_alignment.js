const sharp = require('sharp');

async function testDishAlignment() {
  const headMeta = await sharp('public/images/eating/bakasur_head_only_transparent.png').metadata();
  const W = headMeta.width; // 295
  const H = headMeta.height; // 530

  // Calibrated mouth coordinates
  const mouthTopRatio = 0.722; // 382.6px
  const mouthLeftRatio = 0.356; // 105px

  const mouthX = Math.round(W * mouthLeftRatio);
  const mouthY = Math.round(H * mouthTopRatio);

  console.log(`Mouth center in head: (${mouthX}, ${mouthY})`);

  // Load user selected dish (e.g. butter chicken)
  // Scaled to match the mockup size: ~50px
  const dishSize = 52;
  const dishBmp = await sharp('public/images/eating/butter_chicken_dish_flying.png')
    .resize(dishSize, dishSize)
    .png()
    .toBuffer();

  // Create speed lines buffer
  const svgLines = `<svg width="35" height="${dishSize}">
    <line x1="5" y1="${dishSize/2 - 4}" x2="30" y2="${dishSize/2 - 4}" stroke="white" stroke-width="2.5" stroke-linecap="round" opacity="0.7"/>
    <line x1="0" y1="${dishSize/2}" x2="33" y2="${dishSize/2}" stroke="white" stroke-width="3" stroke-linecap="round" opacity="0.9"/>
    <line x1="8" y1="${dishSize/2 + 4}" x2="28" y2="${dishSize/2 + 4}" stroke="white" stroke-width="2" stroke-linecap="round" opacity="0.6"/>
  </svg>`;
  const linesBmp = await sharp(Buffer.from(svgLines)).png().toBuffer();

  // Composite a row of 3 dishes flying towards mouth
  // Spacing = 80px
  // Dish 0 entering mouth (x = mouthX - 10)
  // Dish 1 at x = mouthX - 90
  // Dish 2 at x = mouthX - 170
  // Canvas width: expand to 500 so we see the full row
  const canvasW = 550;
  const canvasH = 530;
  const headLeft = canvasW - W; // anchor head to right edge: 550 - 295 = 255

  const absMouthX = headLeft + mouthX; // 255 + 105 = 360
  const absMouthY = mouthY; // 383

  const composites = [
    // Head on right
    {
      input: 'public/images/eating/bakasur_head_only_transparent.png',
      left: headLeft,
      top: 0
    }
  ];

  const offsets = [-15, -95, -175];
  for (const dx of offsets) {
    const dishLeft = Math.round(absMouthX + dx - dishSize / 2);
    const dishTop = Math.round(absMouthY - dishSize / 2);

    composites.push({
      input: linesBmp,
      left: dishLeft - 38,
      top: dishTop
    });

    composites.push({
      input: dishBmp,
      left: dishLeft,
      top: dishTop
    });
  }

  await sharp({
    create: {
      width: canvasW,
      height: canvasH,
      channels: 4,
      background: { r: 24, g: 40, b: 88, alpha: 1 } // dark blue background #182858
    }
  })
  .composite(composites)
  .png()
  .toFile('public/images/eating/test_mouth_alignment_preview.png');

  console.log('Saved test_mouth_alignment_preview.png');
}

testDishAlignment();
