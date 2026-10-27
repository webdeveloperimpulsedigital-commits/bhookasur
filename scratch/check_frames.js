const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '../public/images/chewing');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.webp')).sort();

for (let i = 0; i < 50; i++) {
  const stats = fs.statSync(path.join(dir, files[i]));
  console.log(`${files[i]}: ${stats.size}`);
}
