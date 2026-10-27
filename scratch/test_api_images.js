async function testImages() {
  const dishes = [
    'Ragda Pattice',
    'Ragda Puri',
    'Pani Puri',
    'Batata Bhaji',
    'Masala Pav',
    'Cheese Pav Bhaji',
    'Kanda Bhaji'
  ];

  for (const dish of dishes) {
    try {
      const res = await fetch(`http://localhost:3000/api/ai/dish-image?dish=${encodeURIComponent(dish)}&restaurant=Pune`);
      const contentType = res.headers.get('content-type');
      const canonical = res.headers.get('x-canonical-key');
      const buf = await res.arrayBuffer();
      console.log(`Dish "${dish}": status=${res.status}, canonicalKey="${canonical}", contentType="${contentType}", bytes=${buf.byteLength}`);
    } catch (e) {
      console.error(`Failed for ${dish}:`, e.message);
    }
  }
}

testImages();
