const sharp = require('sharp');

async function findHeadNose() {
  const head = await sharp('public/images/eating/bakasur_head_only_transparent.png').raw().toBuffer({ resolveWithObject: true });
  const w = head.info.width;
  
  // Nose tip is the leftmost skin pixel around y=250 to 320
  let minX = w, noseY = 0;
  for (let y = 250; y < 320; y++) {
    for (let x = 0; x < 150; x++) {
      const idx = (y * w + x) * 4;
      const r = head.data[idx], g = head.data[idx+1], b = head.data[idx+2], a = head.data[idx+3];
      // skin color
      if (a > 100 && r > 150 && g > 100 && b > 60 && r > g && g > b) {
        if (x < minX) {
          minX = x;
          noseY = y;
        }
      }
    }
  }
  console.log('Head Nose tip:', { x: minX, y: noseY });
}

findHeadNose();
