const sharp = require('sharp');

async function findMouthCoordinates() {
  const { data, info } = await sharp('public/images/chewing/frame_000.webp').raw().toBuffer({ resolveWithObject: true });
  const W = info.width;
  const H = info.height;

  // Upper teeth:
  let teethX = 0, teethY = 0, teethCount = 0;
  // Lower lip:
  let lipX = 0, lipY = 0, lipCount = 0;

  for (let y = 320; y <= 450; y++) {
    for (let x = 40; x <= 140; x++) {
      const idx = (y * W + x) * 4;
      const r = data[idx], g = data[idx+1], b = data[idx+2], a = data[idx+3];
      // Upper teeth (white)
      if (a > 100 && r > 180 && g > 175 && b > 160 && y < 385) {
        teethX += x; teethY += y; teethCount++;
      }
      // Lower lip / chin boundary
      if (a > 100 && r > 150 && g < 100 && b < 100 && y > 390) {
        lipX += x; lipY += y; lipCount++;
      }
    }
  }

  console.log('Teeth center:', teethCount ? { x: teethX / teethCount, y: teethY / teethCount } : 'none');
  console.log('Lower lip center:', lipCount ? { x: lipX / lipCount, y: lipY / lipCount } : 'none');
}

findMouthCoordinates();
