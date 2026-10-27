const sharp = require('sharp');

async function analyzeAllFrames() {
  let globalMinX = 999, globalMaxX = 0, globalMinY = 999, globalMaxY = 0;

  for (let i = 0; i <= 24; i++) {
    const file = `public/images/chewing/frame_${String(i).padStart(3, '0')}.webp`;
    const { data, info } = await sharp(file).raw().toBuffer({ resolveWithObject: true });
    
    // Check mouth and jaw bounds
    for (let y = 0; y < info.height; y++) {
      for (let x = 0; x < info.width; x++) {
        const a = data[(y * info.width + x) * 4 + 3];
        if (a > 30) {
          if (x < globalMinX) globalMinX = x;
          if (x > globalMaxX) globalMaxX = x;
          if (y < globalMinY) globalMinY = y;
          if (y > globalMaxY) globalMaxY = y;
        }
      }
    }
  }

  console.log('Global bounds across all 25 raw frames:', {
    globalMinX, globalMaxX, globalMinY, globalMaxY
  });
}

analyzeAllFrames();
