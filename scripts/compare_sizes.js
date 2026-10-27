const sharp = require('sharp');

async function check() {
  const metaHead = await sharp('public/images/eating/bakasur_head_only_transparent.png').metadata();
  const metaChew = await sharp('public/images/chewing/frame_000.webp').metadata();
  console.log('Head transparent:', metaHead.width, 'x', metaHead.height);
  console.log('Chewing frame 0:', metaChew.width, 'x', metaChew.height);
}

check();
