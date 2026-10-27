const sharp = require('sharp');

async function testHeadAlignment() {
  // In frame_000.webp (640x800):
  // Let's find the scale factor to match bakasur_head_only_transparent.png (295x530)
  // Let's measure distance from nose tip to earring in both.
  
  // In bakasur_head_only_transparent.png:
  // Nose tip is around x: 84, y: 280
  // Earring is around x: 208, y: 375
  // dx = 124, dy = 95, dist = 156.2
  
  // In frame_000.webp:
  // Nose tip is around x: 10, y: 300 + 40 = 340? Let's find exact nose tip in frame_000.
  const chew = await sharp('public/images/chewing/frame_000.webp').raw().toBuffer({ resolveWithObject: true });
  const w = chew.info.width;
  
  // Find leftmost non-transparent pixel between y=300 and 400 (nose tip)
  let minX = w, noseY = 0;
  for (let y = 300; y < 450; y++) {
    for (let x = 0; x < 200; x++) {
      const idx = (y * w + x) * 4;
      if (chew.data[idx + 3] > 100) {
        if (x < minX) {
          minX = x;
          noseY = y;
        }
        break;
      }
    }
  }
  console.log('Frame0 Nose tip:', { x: minX, y: noseY });
}

testHeadAlignment();
