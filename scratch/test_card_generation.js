const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function testCardGeneration() {
  const heroPath = path.join(__dirname, '../public/images/final-frames/food-tour-img-gastrium.jpg');
  if (!fs.existsSync(heroPath)) {
    console.error('Hero path not found:', heroPath);
    return;
  }

  const W = 1080;
  const padding = 44;
  const innerW = W - padding * 2;
  const imgH = innerW; // 992px
  const H = 1420;

  // Resize hero image to 992x992
  const heroBuffer = await sharp(heroPath)
    .resize(innerW, imgH, { fit: 'cover' })
    .toBuffer();

  const svgCard = `
    <svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
      <style>
        .title { font-family: 'Segoe UI', system-ui, -apple-system, Roboto, Arial, sans-serif; font-size: 38px; font-weight: 800; fill: #0B1B48; }
        .sub { font-family: 'Segoe UI', system-ui, -apple-system, Roboto, Arial, sans-serif; font-size: 26px; font-weight: 500; fill: #475569; }
        .cta { font-family: 'Segoe UI', system-ui, -apple-system, Roboto, Arial, sans-serif; font-size: 27px; font-weight: 700; fill: #0B1B48; }
        .link { font-family: 'Segoe UI', system-ui, -apple-system, Roboto, Arial, sans-serif; font-size: 30px; font-weight: 700; fill: #2563EB; }
      </style>
      <rect width="${W}" height="${H}" fill="#FFFFFF" rx="36" />
      <g transform="translate(${padding}, ${padding + imgH + 48})">
        <text x="6" y="32" class="title">Maine Bhookasur ke saath Food Tour kiya!</text>
        <text x="6" y="78" class="sub">Aap bhi Bhookasur ke saath Food Tour kijiye aur apna food spot share kijiye!</text>
        <text x="6" y="132" class="cta">👉 Join the Food Tour:</text>
        <text x="6" y="174" class="link">https://gastrium.in/bhookasur_ka_food_tour</text>
      </g>
    </svg>
  `;

  const roundedCornersMask = Buffer.from(
    `<svg width="${innerW}" height="${imgH}">
      <rect x="0" y="0" width="${innerW}" height="${imgH}" rx="28" fill="#fff"/>
    </svg>`
  );

  const roundedHero = await sharp(heroBuffer)
    .composite([{ input: roundedCornersMask, blend: 'dest-in' }])
    .png()
    .toBuffer();

  const finalCard = await sharp(Buffer.from(svgCard))
    .composite([
      { input: roundedHero, top: padding, left: padding }
    ])
    .jpeg({ quality: 94 })
    .toBuffer();

  const outputPath = path.join(__dirname, '../public/images/final-frames/bhookasur-share-card-pass.jpg');
  fs.writeFileSync(outputPath, finalCard);
  console.log('Successfully generated clean card at:', outputPath);
}

testCardGeneration().catch(console.error);
