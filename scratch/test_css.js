async function testCss() {
  const res = await fetch('http://localhost:3000/');
  console.log('Page status:', res.status);
  const html = await res.text();
  console.log('Page length:', html.length);
  const match = html.match(/href="(\/_next\/static\/css\/[^"]+)"/);
  if (match) {
    const cssUrl = 'http://localhost:3000' + match[1];
    console.log('Fetching CSS:', cssUrl);
    const cssRes = await fetch(cssUrl);
    console.log('CSS Status:', cssRes.status);
    const cssText = await cssRes.text();
    console.log('CSS Length:', cssText.length, 'preview:', cssText.substring(0, 100));
  } else {
    console.log('No CSS tag match found');
  }
}

testCss().catch(console.error);
