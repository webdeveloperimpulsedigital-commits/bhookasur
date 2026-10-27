const sharp = require('sharp');

async function findEarringAndHorn() {
  const head = await sharp('public/images/eating/bakasur_head_only_transparent.png').raw().toBuffer({ resolveWithObject: true });
  const chew = await sharp('public/images/chewing/frame_000.webp').raw().toBuffer({ resolveWithObject: true });

  // Earring center
  function findEarring(buf, w, h) {
    let sumX = 0, sumY = 0, count = 0;
    for (let y = Math.floor(h * 0.4); y < Math.floor(h * 0.8); y++) {
      for (let x = Math.floor(w * 0.3); x < Math.floor(w * 0.9); x++) {
        const idx = (y * w + x) * 4;
        const r = buf[idx], g = buf[idx+1], b = buf[idx+2], a = buf[idx+3];
        // gold color of earring: very bright yellow/gold
        if (a > 200 && r > 200 && g > 150 && g < 210 && b < 60) {
          sumX += x;
          sumY += y;
          count++;
        }
      }
    }
    return count > 0 ? { x: sumX / count, y: sumY / count, count } : null;
  }

  console.log('Head Earring:', findEarring(head.data, head.info.width, head.info.height));
  console.log('Chew Earring:', findEarring(chew.data, chew.info.width, chew.info.height));
}

findEarringAndHorn();
