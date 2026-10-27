const sharp = require('sharp');
const fs = require('fs');

async function checkAll() {
  const files = [
    'public/images/bakasur_eating_head.png',
    'public/images/eating/bakasur_eating_head_clean.png',
    'public/images/eating/bakasur_eating_open_mouth.png',
    'public/images/eating/bakasur_head_only_transparent.png',
    'public/images/eating/mockup_head_crop.png',
    'public/images/eating/mockup_samosas_row.png'
  ];

  for (const f of files) {
    if (fs.existsSync(f)) {
      const meta = await sharp(f).metadata();
      console.log(f, ':', meta.width, 'x', meta.height, 'alpha:', meta.hasAlpha);
    }
  }
}

checkAll();
