const fs = require('fs');

let content = fs.readFileSync('app/api/ai/dish-image/route.ts', 'utf8');
let matchFuncCode = content.substring(
  content.indexOf('function matchDishToCanonicalKey'),
  content.indexOf('function resolveDishPhotoUrl')
);
matchFuncCode = matchFuncCode.replace(/dishName:\s*string/g, 'dishName');
matchFuncCode = matchFuncCode.replace(/restaurantName:\s*string\s*=\s*''/g, "restaurantName = ''");
matchFuncCode = matchFuncCode.replace(/\):\s*string\s*\{/g, ') {');

eval(matchFuncCode);

const testDishes = [
  'Mango Barfi',
  'Chitale Bandhu Signature Mango Barfi (Amba Barfi)',
  'Amba Barfi',
  'Barfi',
  'Kaju Barfi',
  'Mawa Barfi',
  'Kaju Katli',
  'Pista Barfi',
  'Badam Barfi',
  'Besan Barfi',
  'Special Barfi',
  'Chitale Mango Barfi',
  'Kaju Katli (250g)'
];

testDishes.forEach(d => {
  console.log(`${d.padEnd(52)} => KEY: ${matchDishToCanonicalKey(d)}`);
});
