async function run() {
  const url = 'http://localhost:3000/api/ai/dish-image?dish=Vada%20Pav&restaurant=Joshi%20Wadewale';
  
  // 1. Initial request
  const t0 = Date.now();
  const res1 = await fetch(url, { headers: { 'Accept': 'image/webp' } });
  const buf1 = await res1.arrayBuffer();
  const t1 = Date.now();
  const etag = res1.headers.get('etag');
  console.log(`First request: ${res1.status} (${res1.headers.get('content-type')}), Size: ${buf1.byteLength} bytes, Time: ${t1 - t0}ms, ETag: ${etag}`);

  // 2. Second request (in-memory cache test)
  const t2 = Date.now();
  const res2 = await fetch(url, { headers: { 'Accept': 'image/webp' } });
  const buf2 = await res2.arrayBuffer();
  const t3 = Date.now();
  console.log(`Second request (cached in memory): ${res2.status}, Size: ${buf2.byteLength} bytes, Time: ${t3 - t2}ms`);

  // 3. Conditional 304 request
  const t4 = Date.now();
  const res3 = await fetch(url, { headers: { 'Accept': 'image/webp', 'if-none-match': etag } });
  const t5 = Date.now();
  console.log(`Third request with ETag (304 Not Modified): ${res3.status}, Time: ${t5 - t4}ms`);
}

run().catch(console.error);
