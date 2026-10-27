const sharp = require('sharp');
const fs = require('fs');

async function test() {
  const buf = fs.readFileSync('./public/images/food/vada_pav.jpg');
  const size = 240;
  const radius = size / 2 - 4;
  const maskSvg = Buffer.from(
    `<svg width="${size}" height="${size}">
      <defs>
        <radialGradient id="featherMask" cx="50%" cy="50%" r="50%">
          <stop offset="92%" stop-color="white" stop-opacity="1" />
          <stop offset="100%" stop-color="white" stop-opacity="0" />
        </radialGradient>
      </defs>
      <circle cx="${size / 2}" cy="${size / 2}" r="${radius}" fill="url(#featherMask)" />
    </svg>`
  );

  const pngOut = await sharp(buf)
    .resize(size, size, { fit: 'cover', position: 'center' })
    .composite([{ input: maskSvg, blend: 'dest-in' }])
    .png({ quality: 90, compressionLevel: 8 })
    .toBuffer();

  const webpOut = await sharp(buf)
    .resize(size, size, { fit: 'cover', position: 'center' })
    .composite([{ input: maskSvg, blend: 'dest-in' }])
    .webp({ quality: 82, alphaQuality: 90, effort: 4 })
    .toBuffer();

  console.log('PNG size:', pngOut.length, 'bytes');
  console.log('WebP size:', webpOut.length, 'bytes');
  console.log('Savings:', (((pngOut.length - webpOut.length) / pngOut.length) * 100).toFixed(1) + '%');
}

test().catch(console.error);
