const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function optimizeFoodImages() {
  const foodDir = path.join(__dirname, '..', 'public', 'images', 'food');
  const files = fs.readdirSync(foodDir).filter(f => f.endsWith('.jpg') || f.endsWith('.jpeg'));

  console.log(`Found ${files.length} food images to optimize in ${foodDir}`);
  let totalBefore = 0;
  let totalAfter = 0;

  for (const file of files) {
    const filePath = path.join(foodDir, file);
    const stat = fs.statSync(filePath);
    totalBefore += stat.size;

    // Read buffer
    const inputBuf = fs.readFileSync(filePath);
    
    // Create optimized JPEG (max 800x800, quality 82, progressive, mozjpeg)
    const optJpeg = await sharp(inputBuf)
      .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 82, mozjpeg: true, progressive: true })
      .toBuffer();

    // Create companion WebP (max 800x800, quality 80)
    const baseName = file.replace(/\.(jpg|jpeg)$/i, '');
    const webpPath = path.join(foodDir, `${baseName}.webp`);
    const optWebp = await sharp(inputBuf)
      .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 80, effort: 4 })
      .toBuffer();

    fs.writeFileSync(filePath, optJpeg);
    fs.writeFileSync(webpPath, optWebp);

    totalAfter += optJpeg.size;
  }

  console.log(`Optimization complete!`);
  console.log(`Original total: ${(totalBefore / (1024 * 1024)).toFixed(2)} MB`);
  console.log(`New JPEG total: ${(totalAfter / (1024 * 1024)).toFixed(2)} MB`);
  console.log(`Saved: ${(100 - (totalAfter / totalBefore * 100)).toFixed(1)}%`);
}

optimizeFoodImages().catch(console.error);
