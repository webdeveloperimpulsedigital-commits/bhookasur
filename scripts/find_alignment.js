const sharp = require('sharp');

async function findPerfectAlignment() {
  // Let's use template matching on the mustache and nose area
  // In bakasur_head_only_transparent_clean.png:
  // Nose bottom: x=84, y=289
  // Mustache curl tip: x=135, y=330
  // Earring: x=208, y=375

  // In frame_000.webp:
  // Let's test scales from 0.50 to 0.54 in steps of 0.005
  // and offsets from left: 70 to 95, top: 110 to 135
  // We compare pixel error on the nose and cheek region (x: 85 to 140, y: 270 to 320 in head)
  const head = await sharp('public/images/eating/bakasur_head_only_transparent_clean.png').raw().toBuffer({ resolveWithObject: true });
  const headData = head.data;
  const headW = head.info.width;
  const headH = head.info.height;

  const f0 = await sharp('public/images/chewing/frame_000.webp').raw().toBuffer({ resolveWithObject: true });

  let bestError = Infinity;
  let bestScale = 0.516;
  let bestLeft = 78;
  let bestTop = 111;

  for (let s = 0.505; s <= 0.535; s += 0.005) {
    const sW = Math.round(640 * s);
    const sH = Math.round(800 * s);
    const resized = await sharp('public/images/chewing/frame_000.webp').resize(sW, sH).raw().toBuffer({ resolveWithObject: true });

    for (let left = 70; left <= 90; left += 2) {
      for (let top = 105; top <= 125; top += 2) {
        let err = 0;
        let count = 0;

        // Sample nose/cheek area: x in [90, 130], y in [270, 310]
        for (let hy = 270; hy < 310; hy += 2) {
          for (let hx = 90; hx < 130; hx += 2) {
            const rx = hx - left;
            const ry = hy - top;

            if (rx >= 0 && rx < sW && ry >= 0 && ry < sH) {
              const hIdx = (hy * headW + hx) * 4;
              const rIdx = (ry * sW + rx) * 4;

              if (headData[hIdx + 3] > 200 && resized.data[rIdx + 3] > 200) {
                const dr = headData[hIdx] - resized.data[rIdx];
                const dg = headData[hIdx + 1] - resized.data[rIdx + 1];
                const db = headData[hIdx + 2] - resized.data[rIdx + 2];
                err += Math.abs(dr) + Math.abs(dg) + Math.abs(db);
                count++;
              }
            }
          }
        }

        if (count > 200) {
          const avgErr = err / count;
          if (avgErr < bestError) {
            bestError = avgErr;
            bestScale = s;
            bestLeft = left;
            bestTop = top;
          }
        }
      }
    }
  }

  console.log('Best match:', { bestScale, bestLeft, bestTop, bestError });
}

findPerfectAlignment();
