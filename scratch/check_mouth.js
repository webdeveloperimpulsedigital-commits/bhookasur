// Let's inspect frames around mouth area using Jimp or sharp or raw buffer
const fs = require('fs');
console.log('Frame 0 to 24 check');
for (let i = 0; i <= 25; i++) {
  const name = `frame_${String(i).padStart(3, '0')}.webp`;
  const size = fs.statSync(`public/images/chewing/${name}`).size;
  console.log(`${name}: ${size}`);
}
