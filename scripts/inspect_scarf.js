const sharp = require('sharp');

async function inspectScarf() {
  const { data, info } = await sharp('public/images/chewing/frame_000.webp').raw().toBuffer({ resolveWithObject: true });
  const W = info.width;

  // Let's sample X across neck from beard (x: 100) to hair (x: 500)
  for (let y = 470; y <= 560; y += 10) {
    let row = '';
    for (let x = 80; x <= 450; x += 15) {
      const idx = (y * W + x) * 4;
      const r = data[idx], g = data[idx+1], b = data[idx+2], a = data[idx+3];
      if (a < 30) {
        row += ' ';
      } else if (r > 120 && g < 50 && b < 60) {
        row += 'R'; // Red scarf
      } else if (r < 50 && g < 50 && b < 50) {
        row += 'B'; // Beard/hair (black)
      } else if (r > 160 && g > 100 && b > 60) {
        row += 'S'; // Skin
      } else {
        row += '.';
      }
    }
    console.log(`Y=${y}: ${row}`);
  }
}

inspectScarf();
