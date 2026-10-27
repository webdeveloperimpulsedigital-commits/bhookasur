const http = require('http');

function testUrl(urlStr) {
  return new Promise((resolve, reject) => {
    http.get(urlStr, (res) => {
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => {
        const body = Buffer.concat(chunks);
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          size: body.length
        });
      });
    }).on('error', reject);
  });
}

async function run() {
  console.log('Testing live endpoints against localhost:3000...\n');

  // 1. Clear-cache endpoint
  const clearCacheRes = await testUrl('http://localhost:3000/api/clear-cache');
  console.log('[CLEAR-CACHE ENDPOINT]');
  console.log('Status:', clearCacheRes.statusCode);
  console.log('Clear-Site-Data header:', clearCacheRes.headers['clear-site-data']);
  console.log('Cache-Control:', clearCacheRes.headers['cache-control']);

  // 2. KFC image
  const kfcRes = await testUrl('http://localhost:3000/api/ai/dish-image?dish=KFC%20Hot%20%26%20Crispy%20Fried%20Chicken%20(4%20Pcs)&restaurant=KFC&v=v30');
  console.log('\n[KFC FRIED CHICKEN IMAGE]');
  console.log('Status:', kfcRes.statusCode);
  console.log('Content-Type:', kfcRes.headers['content-type']);
  console.log('X-Canonical-Key:', kfcRes.headers['x-canonical-key']);
  console.log('Clear-Site-Data header:', kfcRes.headers['clear-site-data']);
  console.log('PNG Size:', kfcRes.size, 'bytes');

  // 3. Sujata Mango Mastani image
  const mastaniRes = await testUrl('http://localhost:3000/api/ai/dish-image?dish=Sujata%20Famous%20Pure%20Mango%20Mastani&restaurant=Sujata%20Mastani&v=v30');
  console.log('\n[SUJATA MANGO MASTANI IMAGE]');
  console.log('Status:', mastaniRes.statusCode);
  console.log('Content-Type:', mastaniRes.headers['content-type']);
  console.log('X-Canonical-Key:', mastaniRes.headers['x-canonical-key']);
  console.log('Clear-Site-Data header:', mastaniRes.headers['clear-site-data']);
  console.log('PNG Size:', mastaniRes.size, 'bytes');

  // 4. Pizza Fire image
  const pizzaRes = await testUrl('http://localhost:3000/api/ai/dish-image?dish=Wood-Fired%20Pizza%20Fire%20Special&restaurant=Pizza%20Fire&v=v30');
  console.log('\n[PIZZA FIRE WOOD-FIRED PIZZA IMAGE]');
  console.log('Status:', pizzaRes.statusCode);
  console.log('Content-Type:', pizzaRes.headers['content-type']);
  console.log('X-Canonical-Key:', pizzaRes.headers['x-canonical-key']);
  console.log('PNG Size:', pizzaRes.size, 'bytes');

  // 5. Tender Coconut Ice Cream
  const iceRes = await testUrl('http://localhost:3000/api/ai/dish-image?dish=Tender%20Coconut%20Natural%20Ice%20Cream&restaurant=Naturals&v=v30');
  console.log('\n[TENDER COCONUT ICE CREAM IMAGE]');
  console.log('Status:', iceRes.statusCode);
  console.log('Content-Type:', iceRes.headers['content-type']);
  console.log('X-Canonical-Key:', iceRes.headers['x-canonical-key']);
  console.log('PNG Size:', iceRes.size, 'bytes');
}

run().catch(console.error);
