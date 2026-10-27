const sharp = require('sharp');

async function inspectOriginal() {
  const { data, info } = await sharp('public/images/chewing/frame_000.webp').raw().toBuffer({ resolveWithObject: true });
  const W = info.width;
  const H = info.height;

  // Let's see where the jaw/beard, ear, neck, and shoulders are in chewing/frame_000.webp
  // In frame 0 (mouth wide open):
  // Let's check skin pixels vs red cloth vs black beard/hair
  console.log('Chewing frame_000 breakdown:');
  for (let y = 350; y <= 650; y += 25) {
    let counts = { skin: 0, hair: 0, red: 0, gold: 0, transparent: 0, other: 0 };
    for (let x = 0; x < W; x++) {
      const idx = (y * W + x) * 4;
      const r = data[idx], g = data[idx+1], b = data[idx+2], a = data[idx+3];
      if (a < 30) counts.transparent++;
      else if (r > 120 && g < 60 && b < 60) counts.red++;
      else if (r > 170 && g > 120 && b < 80) counts.gold++;
      else if (r < 55 && g < 55 && b < 55) counts.hair++;
      else if (r > 130 && g > 70 && b > 40) counts.skin++;
      else counts.other++;
    }
    console.log(`Y=${y}: skin=${counts.skin} hair=${counts.hair} red=${counts.red} gold=${counts.gold} trans=${counts.transparent} other=${counts.other}`);
  }
}

inspectOriginal();
