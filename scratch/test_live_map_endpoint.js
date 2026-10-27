const http = require('http');

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data, error: e.message });
        }
      });
    }).on('error', reject);
  });
}

async function main() {
  const sessionId = 'bkt_sess_1789123858588_mhgdge9d060';

  console.log('--- 1. Testing with User Session ID ---');
  const resWithSession = await fetchJson(`http://localhost:3000/api/campaign/map?session_id=${sessionId}`);
  console.log('HTTP Status:', resWithSession.status);
  console.log('Success:', resWithSession.body.success);
  console.log('Stats:', resWithSession.body.data.stats);
  console.log('Total Points Plotted:', resWithSession.body.data.points?.length);
  console.log('Current User Spots:', resWithSession.body.data.currentUserSpots);
  const bluePins = (resWithSession.body.data.points || []).filter(p => p.isCurrentUserSpot);
  const redPins = (resWithSession.body.data.points || []).filter(p => !p.isCurrentUserSpot);
  console.log('Blue Pins Count:', bluePins.length, bluePins.map(p => `Stop ${p.stopNumber}: ${p.name}`));
  console.log('Red Pins Count:', redPins.length);

  console.log('\n--- 2. Testing without Session ID (Global Visitor) ---');
  const resNoSession = await fetchJson('http://localhost:3000/api/campaign/map');
  console.log('HTTP Status:', resNoSession.status);
  console.log('Success:', resNoSession.body.success);
  console.log('Stats:', resNoSession.body.data.stats);
  console.log('Total Points Plotted:', resNoSession.body.data.points?.length);
  console.log('Current User Spots Count:', resNoSession.body.data.currentUserSpots?.length);
  console.log('Red Pins Count:', (resNoSession.body.data.points || []).filter(p => !p.isCurrentUserSpot).length);
}

main().catch(console.error);
