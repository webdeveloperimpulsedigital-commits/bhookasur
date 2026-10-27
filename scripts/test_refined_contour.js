const sharp = require('sharp');

async function testContour() {
  const srcFile = 'public/images/chewing/frame_000.webp';
  const { data, info } = await sharp(srcFile).raw().toBuffer({ resolveWithObject: true });
  const W = info.width; // 640
  const H = info.height; // 800

  // Refined contour:
  // x <= 170: Beard (cutoff = 548)
  // x 170 -> 240: Jawline to under ear (cutoff slopes 548 -> 475)
  // x 240 -> 320: Under neck, above red sash (cutoff = 470)
  // x 320 -> 460: Above shoulder, under hair (cutoff = 510)
  // x > 460: Hair falling down back (cutoff = 555)
  function getCutoff(x) {
    if (x <= 170) return 548;
    if (x <= 240) return 548 - ((x - 170) / 70) * (548 - 475);
    if (x <= 320) return 470;
    if (x <= 460) return 470 + ((x - 320) / 140) * (515 - 470);
    return 555;
  }

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const cutoffY = getCutoff(x);
      if (y > cutoffY) {
        const idx = (y * W + x) * 4;
        const dist = y - cutoffY;
        if (dist > 6) {
          data[idx + 3] = 0;
        } else {
          const factor = (6 - dist) / 6;
          data[idx + 3] = Math.round(data[idx + 3] * factor);
        }
      }
    }
  }

  await sharp(data, { raw: { width: W, height: H, channels: 4 } })
    .extract({ left: 0, top: 0, width: 640, height: 555 })
    .png()
    .toFile('public/images/chewing_head/test_contour_head.png');

  console.log('Saved test_contour_head.png');
}

testContour();
