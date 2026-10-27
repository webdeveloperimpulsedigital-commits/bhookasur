const sharp = require('sharp');

async function analyze() {
  const headBuf = await sharp('public/images/eating/bakasur_head_only_transparent.png').raw().toBuffer({ resolveWithObject: true });
  const chewBuf = await sharp('public/images/chewing/frame_000.webp').raw().toBuffer({ resolveWithObject: true });

  console.log('Head info:', headBuf.info);
  console.log('Chew info:', chewBuf.info);
}

analyze();
