const sharp = require('sharp');

async function inspectHairContour() {
  const { data, info } = await sharp('public/images/chewing/frame_000.webp').raw().toBuffer({ resolveWithObject: true });
  const W = info.width;
  const H = info.height;

  // Let's see what is behind the ear (x: 260 to 620, y: 400 to 600)
  for (let x = 260; x <= 620; x += 20) {
    let hairBottom = -1;
    let clothBottom = -1;
    let skinBottom = -1;
    for (let y = 400; y < 650; y++) {
      const idx = (y * W + x) * 4;
      const r = data[idx], g = data[idx+1], b = data[idx+2], a = data[idx+3];
      if (a < 30) continue;
      // Red cloth:
      if (r > 80 && g < 50 && b < 55) {
        clothBottom = y;
      } else if (r < 55 && g < 55 && b < 55) {
        // Hair:
        hairBottom = y;
      } else if (r > 120 && g > 65) {
        // Skin:
        skinBottom = y;
      }
    }
    console.log(`x=${x}: skinBot=${skinBottom}, clothBot=${clothBottom}, hairBot=${hairBottom}`);
  }
}

inspectHairContour();
