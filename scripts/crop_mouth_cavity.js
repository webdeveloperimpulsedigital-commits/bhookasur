const sharp = require('sharp');

async function inspectMouthCavity() {
  await sharp('public/images/eating/bakasur_head_only_transparent.png')
    .extract({ left: 80, top: 330, width: 70, height: 95 })
    .png()
    .toFile('public/images/eating/mouth_cavity_crop.png');

  console.log('Saved mouth_cavity_crop.png');
}

inspectMouthCavity();
