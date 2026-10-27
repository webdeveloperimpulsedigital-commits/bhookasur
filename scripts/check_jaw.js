const sharp = require('sharp');

async function checkJawMovement() {
  for (let i = 0; i <= 24; i += 3) {
    const file = `public/images/chewing/frame_${String(i).padStart(3, '0')}.webp`;
    const { data, info } = await sharp(file).raw().toBuffer({ resolveWithObject: true });
    
    // Find bottom of beard at x=100 (under mouth)
    let beardY = 0;
    for (let y = 300; y < 650; y++) {
      const idx = (y * info.width + 100) * 4;
      const r = data[idx], g = data[idx+1], b = data[idx+2], a = data[idx+3];
      if (a > 50 && r < 50 && g < 50 && b < 50) {
        beardY = y;
      }
    }
    console.log(`Frame ${i}: bottom of beard at x=100 is Y=${beardY}`);
  }
}

checkJawMovement();
