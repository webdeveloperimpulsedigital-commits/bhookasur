const fs = require('fs');
const content = fs.readFileSync('lib/liveMenu.ts', 'utf8');
const matches = content.match(/name:\s*["'][^"']*(?:pulao|pulav)[^"']*["']/gi);
console.log('Count:', matches ? matches.length : 0);
if (matches) console.log(matches);
