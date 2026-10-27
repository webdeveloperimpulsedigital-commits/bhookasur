const fs = require('fs');

let content = fs.readFileSync('lib/liveMenu.ts', 'utf8');

const updated = content.replace(/\/api\/ai\/dish-image\?dish=([^"'\s&]+)(["'])/g, '/api/ai/dish-image?dish=$1&v=v28$2');

if (updated !== content) {
  fs.writeFileSync('lib/liveMenu.ts', updated, 'utf8');
  console.log('UPDATED liveMenu.ts dish-image URLs with &v=v28');
} else {
  console.log('No dish-image URLs needed update in liveMenu.ts');
}
