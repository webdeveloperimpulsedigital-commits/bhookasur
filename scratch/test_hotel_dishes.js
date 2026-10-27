const fs = require('fs');
const path = require('path');
const ts = require('typescript');
const vm = require('vm');

const liveMenuPath = path.join(__dirname, '../lib/liveMenu.ts');
const liveMenuTs = fs.readFileSync(liveMenuPath, 'utf8');
const liveMenuJs = ts.transpileModule(liveMenuTs, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 }
}).outputText;

const context = {
  module: { exports: {} },
  exports: {},
  require: (mod) => {
    if (mod === '@/lib/dishAssets' || mod === './dishAssets') {
      const daTs = fs.readFileSync(path.join(__dirname, '../lib/dishAssets.ts'), 'utf8');
      const daJs = ts.transpileModule(daTs, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
      const m = { exports: {} };
      vm.runInNewContext(daJs, { module: m, exports: m.exports, require });
      return m.exports;
    }
    return require(mod);
  },
  console
};

vm.runInNewContext(liveMenuJs, context);
const { generateLiveMenuForRestaurant } = context.module.exports.generateLiveMenuForRestaurant ? context.module.exports : context.exports;

const testHotelNames = [
  'Hotel',
  'Hotel Shivraj',
  'Hotel Sandeep',
  'Hotel Panchali',
  'Hotel Grand',
  'Hotel Paradise',
  'Hotel Mayur',
  'Hotel Green Park',
  'Hotel Royal',
  'Hotel City',
  'Hotel Sai',
  'Hotel Abhishek',
  'Hotel Rajdhani'
];

testHotelNames.forEach(h => {
  const dishes = generateLiveMenuForRestaurant({ id: 99, name: h, area: 'City', city: 'Pune' });
  const names = dishes.map(d => d.name);
  const hasPulao = names.some(n => n.includes('Special Veg Pulao'));
  console.log(`"${h}": ${dishes.length} dishes | Has "Special Veg Pulao with Raita": ${hasPulao}`);
  console.log('   Dishes:', names.slice(0, 4));
});
