const sharp = require('sharp');

async function inspectAllFramesRed() {
  for (let i = 0; i <= 24; i += 4) {
    const file = `public/images/chewing/frame_${String(i).padStart(3, '0')}.webp`;
    const { data, info } = await sharp(file).raw().toBuffer({ resolveWithObject: true });
    
    let redCount = 0;
    let minX = 999, maxX = 0, minY = 999, maxY = 0;
    for (let y = 350; y < 650; y++) {
      for (let x = 150; x < 450; x++) {
        const idx = (y * info.width + x) * 4;
        const r = data[idx], g = data[idx+1], b = data[idx+2], a = data[idx+3];
        // Red cloth criteria
        if (a > 30 && r > 70 && g < 50 && b < 55) {
          redCount++;
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }
    console.log(`Frame ${i}: redCount=${redCount}, x=[${minX}, ${maxX}], y=[${minY}, ${maxY}]`);
  }
}

inspectAllFramesRed();
