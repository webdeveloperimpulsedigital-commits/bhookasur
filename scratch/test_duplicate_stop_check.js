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

  console.log('API returned currentUserSpots:');
  console.log(res.data.currentUserSpots);

  const points = res.data.points || [];
  const currentPoints = points.filter(p => p.isCurrentUserSpot);
  console.log(`\nFound ${currentPoints.length} points with isCurrentUserSpot = true:`);
  currentPoints.forEach(p => {
    console.log(`- ID: ${p.id}, Stop ${p.stopNumber}: "${p.name}" at (${p.latitude}, ${p.longitude})`);
  });

  const stop1Points = points.filter(p => p.stopNumber === 1);
  const stop2Points = points.filter(p => p.stopNumber === 2);
  console.log(`\nStop 1 count: ${stop1Points.length}`);
  stop1Points.forEach(p => console.log('  Stop 1:', p.id, p.name, p.latitude, p.longitude));
  console.log(`Stop 2 count: ${stop2Points.length}`);
  stop2Points.forEach(p => console.log('  Stop 2:', p.id, p.name, p.latitude, p.longitude));
}

main().catch(console.error);
