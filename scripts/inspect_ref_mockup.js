const sharp = require('sharp');

async function inspectRefMockup() {
  const { data, info } = await sharp('public/images/eating/bakasur_head_only_transparent.png').raw().toBuffer({ resolveWithObject: true });
  const W = info.width;
  const H = info.height;

  console.log('Reference mockup W=' + W + ', H=' + H);
  // Check if there is any red cloth in bakasur_head_only_transparent.png
  let redPixels = 0;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i+1], b = data[i+2], a = data[i+3];
    if (a > 30 && r > 100 && r > g * 1.5 && r > b * 1.5) {
      redPixels++;
    }
  }
  console.log('Red pixels in bakasur_head_only_transparent.png:', redPixels);
}

inspectRefMockup();
