const { CUISINE_MENUS } = require('./lib/liveMenu.ts');
console.log('Total Cuisine Profiles in CUISINE_MENUS:', CUISINE_MENUS ? CUISINE_MENUS.length : 'none');
if (CUISINE_MENUS) {
  CUISINE_MENUS.forEach((c, idx) => {
    console.log(`${idx + 1}. ${c.name} (${c.dishes ? c.dishes.length : 0} dishes)`);
  });
}
