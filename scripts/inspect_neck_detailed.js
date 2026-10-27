const sharp = require('sharp');

async function inspectRedCloth() {
  const { data, info } = await sharp('public/images/chewing/frame_000.webp').raw().toBuffer({ resolveWithObject: true });
  const W = info.width;
  const H = info.height;

  // Let's print an ASCII map of the region x: 180 to 450, y: 440 to 560
  console.log('Region x: 180-400, y: 440-540:');
  for (let y = 440; y <= 540; y += 5) {
    let line = `${String(y).padStart(3, ' ')}: `;
    for (let x = 180; x <= 400; x += 6) {
      const idx = (y * W + x) * 4;
      const r = data[idx], g = data[idx+1], b = data[idx+2], a = data[idx+3];
      if (a < 30) line += ' ';
      else if (r > 100 && r > g * 1.5 && r > b * 1.5 && r - g > 30) line += 'R'; // Red body cloth
      else if (r > 180 && g > 130 && b < 80) line += 'G'; // Gold earring
      else if (r < 50 && g < 50 && b < 50) line += '#'; // Hair / beard
      else if (r > 120 && g > 70 && b > 40) line += '.'; // Skin
      else line += '?';
    }
    console.log(line);
  }
}

inspectRedCloth();
