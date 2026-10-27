const fs = require('fs');
const text = fs.readFileSync('lib/liveMenu.ts', 'utf8');
const block = text.slice(text.indexOf('export const ICONIC_RESTAURANT_DISHES'), text.indexOf('export const CUISINE_MENUS'));
const keys = [...block.matchAll(/['"]([^'"]+)['"]\s*:\s*\[/g)].map(m => m[1]);
console.log(JSON.stringify(keys, null, 2));
