const fs = require('fs');

async function testVaishali() {
  const res = await fetch('http://localhost:3000/api/restaurants/8/dishes');
  const json = await res.json();
  const fileContent = fs.readFileSync('./scratch/test_all_rankings.js', 'utf8');
  eval(fileContent.replace('testAll().catch(console.error);', ''));

  json.data.forEach(d => {
    console.log(d.name, '-> Score:', calculateDishScore(d, 'Vaishali Restaurant'));
  });
}

testVaishali().catch(console.error);
