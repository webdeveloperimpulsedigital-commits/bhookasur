const fs = require('fs');
const path = require('path');

const liveMenuCode = fs.readFileSync(path.join(__dirname, '../lib/liveMenu.ts'), 'utf8');

const profileRegex = /name:\s*["']([^"']+)["'],\s*keywords:\s*\[([\s\S]*?)\],\s*dishes:\s*\[([\s\S]*?)\]\s*\},/g;
let m;
let i = 0;
while ((m = profileRegex.exec(liveMenuCode)) !== null) {
  const pName = m[1];
  const pDishes = m[3];
  const dishNames = [...pDishes.matchAll(/name:\s*["']([^"']+)["']/g)].map(d => d[1]);
  console.log(`[${i++}] "${pName}" -> ${dishNames.length} dishes`);
  console.log('     ', dishNames.slice(0, 6).join(' | '));
}
