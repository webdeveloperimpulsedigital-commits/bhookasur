const http = require('http');

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve({ error: e.message, raw: data });
        }
      });
    }).on('error', reject);
  });
}

async function main() {
  const sessionId = 'bkt_sess_1789123858588_mhgdge9d060';
  const res = await fetchJson(`http://localhost:3000/api/campaign/map?session_id=${sessionId}`);

  const points = res.data.points || [];
  const stop1Points = points.filter(p => p.stopNumber === 1 && p.isCurrentUserSpot);
  const stop2Points = points.filter(p => p.stopNumber === 2 && p.isCurrentUserSpot);
  const otherStops = points.filter(p => p.stopNumber > 2 && p.isCurrentUserSpot);

  console.log('=== VERIFICATION OF SINGLE PIN PER STOP ===');
  console.log(`Stop 1 Count: ${stop1Points.length}`);
  stop1Points.forEach(p => console.log(` -> Stop 1: [ID ${p.id}] "${p.name}" at (${p.latitude}, ${p.longitude})`));

  console.log(`Stop 2 Count: ${stop2Points.length}`);
  stop2Points.forEach(p => console.log(` -> Stop 2: [ID ${p.id}] "${p.name}" at (${p.latitude}, ${p.longitude})`));

  console.log(`Other User Stops: ${otherStops.length}`);

  const redPinsWithSameName1 = points.filter(p => !p.isCurrentUserSpot && p.name.toLowerCase().includes('blue tokai'));
  const redPinsWithSameName2 = points.filter(p => !p.isCurrentUserSpot && p.name.toLowerCase().includes('relax'));

  console.log(`\nVerified sibling branches remain as Red Pins (Visited Count):`);
  console.log(`- Blue Tokai red pins: ${redPinsWithSameName1.length}`);
  console.log(`- Relax Pure Veg red pins: ${redPinsWithSameName2.length}`, redPinsWithSameName2.map(p => `[ID ${p.id}] "${p.name}" at (${p.latitude}, ${p.longitude})`));

  if (stop1Points.length === 1 && stop2Points.length === 1) {
    console.log('\n[PASS] Stop 1 is on exactly 1 pin, and Stop 2 is on exactly 1 pin! No duplicates.');
  } else {
    console.error('\n[FAIL] Duplicate stops detected!');
    process.exit(1);
  }
}

main().catch(console.error);
