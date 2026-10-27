const sharp = require('sharp');
const fs = require('fs');

async function run() {
  const metadata = await sharp('public/images/bakasur_plate.png').metadata();
  console.log('Original plate metadata:', metadata);

  // Extract character region (0, 0, 576, 610)
  // Extend left and right by 45px with background (4, 17, 91)
  const targetW = 576 + 90; // 666
  const targetH = 610;

  const svgBanner = `<svg width="${targetW}" height="85"><rect width="${targetW}" height="85" fill="#04115b"/></svg>`;

  await sharp('public/images/bakasur_plate.png')
    .extract({ left: 0, top: 0, width: 576, height: 610 })
    .extend({
      top: 0,
      bottom: 0,
      left: 45,
      right: 45,
      background: { r: 4, g: 17, b: 91, alpha: 1 }
    })
    .composite([
      {
        input: Buffer.from(svgBanner),
        top: 0,
        left: 0
      }
    ])
    .png()
    .toFile('public/images/bakasur_plate_character.png');

  const resultMeta = await sharp('public/images/bakasur_plate_character.png').metadata();
  console.log('Updated bakasur_plate_character.png:', resultMeta);
}

run().catch(console.error);
