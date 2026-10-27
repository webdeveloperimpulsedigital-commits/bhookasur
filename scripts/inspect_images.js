const fs = require('fs');
const path = require('path');

// Check files in public/images
const dir = path.join(__dirname, '..', 'public', 'images');
const files = fs.readdirSync(dir);
console.log('Files in public/images:', files);

// Check if there are images in public/images/food_tour
const ftDir = path.join(dir, 'food_tour');
if (fs.existsSync(ftDir)) {
  console.log('Files in public/images/food_tour:', fs.readdirSync(ftDir));
}
