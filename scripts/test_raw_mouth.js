const sharp = require('sharp');

async function testRawMouth() {
  const head = await sharp('public/images/eating/bakasur_head_only_transparent_clean.png').raw().toBuffer({ resolveWithObject: true });
  const headData = head.data;
  const headW = head.info.width;
  const headH = head.info.height;

  // Let's get resized frame 0 at scale 0.56
  const s = 0.56;
  const sW = Math.round(640 * s); // 358
  const sH = Math.round(800 * s); // 448
  const left = 85;
  const top = 101;

  const f0 = await sharp('public/images/chewing/frame_000.webp').resize(sW, sH).raw().toBuffer({ resolveWithObject: true });
  const f0Data = f0.data;

  // Now replace the mouth area in headData with pixels from f0Data!
  // The mouth area in headData:
  // x between 85 and 135, y between 345 and 415
  for (let hy = 345; hy < 415; hy++) {
    for (let hx = 85; hx < 135; hx++) {
      const rx = hx - left;
      const ry = hy - top;

      if (rx >= 0 && rx < sW && ry >= 0 && ry < sH) {
        const rIdx = (ry * sW + rx) * 4;
        const hIdx = (hy * headW + hx) * 4;

        const f0A = f0Data[rIdx + 3];
        if (f0A > 30) {
          headData[hIdx] = f0Data[rIdx];
          headData[hIdx + 1] = f0Data[rIdx + 1];
          headData[hIdx + 2] = f0Data[rIdx + 2];
          headData[hIdx + 3] = f0A;
        } else {
          // If frame0 is empty/transparent here, make headData transparent here
          headData[hIdx + 3] = 0;
        }
      }
    }
  }

  await sharp(headData, { raw: { width: headW, height: headH, channels: 4 } })
    .png()
    .toFile('public/images/eating/test_photoreal_result.png');

  console.log('Saved test_photoreal_result.png');
}

testRawMouth();
