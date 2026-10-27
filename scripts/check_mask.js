const sharp = require('sharp');

async function checkMask() {
  const meta = await sharp('public/images/eating/bakasur_head_only_transparent.png').metadata();
  console.log('Head size:', meta.width, 'x', meta.height);
  
  // Let's find the bottom-most pixel for each column in bakasur_head_only_transparent.png
  const { data, info } = await sharp('public/images/eating/bakasur_head_only_transparent.png').raw().toBuffer({ resolveWithObject: true });
  const W = info.width;
  const H = info.height;

  const bottomY = [];
  for (let x = 0; x < W; x += 10) {
    let maxY = 0;
    for (let y = 0; y < H; y++) {
      const idx = (y * W + x) * 4;
      if (data[idx + 3] > 30) {
        if (y > maxY) maxY = y;
      }
    }
    bottomY.push({ x, maxY });
  }

  console.log('Bottom curve profile:', bottomY.filter(p => p.maxY > 0));
}

checkMask();
