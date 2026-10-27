const sharp = require('sharp');

async function fineGrid() {
  const head = await sharp('public/images/eating/bakasur_head_only_transparent_clean.png').raw().toBuffer({ resolveWithObject: true });
  const headData = head.data;
  const headW = head.info.width;

  let bestError = Infinity;
  let bestScale = 0.535;
  let bestLeft = 88;
  let bestTop = 107;

  for (let s = 0.530; s <= 0.570; s += 0.005) {
    const sW = Math.round(640 * s);
    const sH = Math.round(800 * s);
    const resized = await sharp('public/images/chewing/frame_000.webp').resize(sW, sH).raw().toBuffer({ resolveWithObject: true });

    for (let left = 80; left <= 96; left += 1) {
      for (let top = 100; top <= 116; top += 1) {
        let err = 0;
        let count = 0;

        for (let hy = 270; hy < 315; hy += 2) {
          for (let hx = 90; hx < 135; hx += 2) {
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

  console.log('Fine match:', { bestScale, bestLeft, bestTop, bestError });
}

fineGrid();
