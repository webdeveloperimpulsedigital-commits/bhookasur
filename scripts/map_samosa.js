const sharp = require('sharp');

async function mapSamosa() {
  const { data, info } = await sharp('public/images/eating/bakasur_head_only_transparent.png')
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height } = info;

  for (let y = 320; y <= 425; y += 3) {
    let line = '';
    for (let x = 0; x <= 130; x += 2) {
      const idx = (y * width + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const a = data[idx + 3];

      if (a < 30) {
        line += ' ';
      } else if (r > 190 && g > 190 && b > 190) {
        line += 'W'; // white (teeth or speed line)
      } else if (r > 140 && g < 70 && b < 70) {
        line += 'M'; // mouth/tongue (red)
      } else if (r > 130 && g > 70 && b < 60) {
        line += 'S'; // samosa (brown/orange)
      } else if (r < 50 && g < 50 && b < 50) {
        line += '#'; // black (mustache, beard)
      } else if (r > 120 && g > 80 && b > 50) {
        line += 'F'; // face skin
      } else {
        line += '.';
      }
    }
    console.log(`Y=${y.toString().padStart(3, '0')}: ${line}`);
  }
}

mapSamosa();
