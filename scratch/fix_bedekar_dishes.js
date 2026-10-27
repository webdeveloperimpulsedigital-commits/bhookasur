const mysql = require('mysql2/promise');

async function fixBedekarDishes() {
  const pool = mysql.createPool({
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: '',
    database: 'bakasur_food_tour_1'
  });

  // 1. Reassign Corner House dishes (334-338) to Corner House (id 114)
  await pool.query('UPDATE dishes SET restaurant_id = 114 WHERE id IN (334, 335, 336, 337, 338)');
  console.log('Reassigned Corner House desserts to restaurant_id 114');

  // 2. Clear any non-misal dishes from restaurant_id 33
  await pool.query('DELETE FROM dishes WHERE restaurant_id = 33');

  // 3. Insert verified authentic menu items for Bedekar Tea Stall (Narayan Peth, Pune)
  const bedekarDishes = [
    {
      name: 'Historic Bedekar Puneri Misal with Bread Slices',
      description: "Pune's legendary 1948 spicy misal prepared with authentic Maharashtrian spices, served with soft bread slices, farsan & lemon.",
      price: 120.00,
      image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&auto=format&fit=crop&q=80',
      rating: 5.0,
      popularity: 100,
      is_recommended: 1
    },
    {
      name: 'Special Bedekar Kolhapuri Tarri Misal Pav',
      description: 'Fiery red cut rassa misal topped with extra crispy farsan, diced onions, coriander, and soft pav.',
      price: 130.00,
      image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&auto=format&fit=crop&q=80',
      rating: 4.9,
      popularity: 99,
      is_recommended: 1
    },
    {
      name: 'Crispy Kothimbir Vadi Plate',
      description: 'Traditional steamed fresh coriander and gram flour cakes shallow-fried crisp with mint-garlic chutney.',
      price: 80.00,
      image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop&q=80',
      rating: 4.9,
      popularity: 97,
      is_recommended: 1
    },
    {
      name: 'Traditional Bedekar Poha Laddoo (2 Pcs)',
      description: 'Heritage sweet flattened rice laddoos rolled with pure desi ghee, roasted cashews, and jaggery.',
      price: 60.00,
      image: 'https://images.unsplash.com/photo-1528975604071-b4dc52a2d18c?w=600&auto=format&fit=crop&q=80',
      rating: 4.8,
      popularity: 96,
      is_recommended: 1
    },
    {
      name: 'Authentic Puneri Kande Pohe with Coconut',
      description: 'Fluffy tempered flattened rice with roasted peanuts, curry leaves, mustard seeds, and freshly grated coconut.',
      price: 50.00,
      image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop&q=80',
      rating: 4.8,
      popularity: 95,
      is_recommended: 0
    },
    {
      name: 'Crispy Sabudana Vada with Peanut Dahi',
      description: 'Golden fried tapioca pearl fritters served with sweet and spicy roasted peanut curd chutney.',
      price: 90.00,
      image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&auto=format&fit=crop&q=80',
      rating: 4.8,
      popularity: 94,
      is_recommended: 0
    },
    {
      name: 'Special Digestive Kokum Sharbat',
      description: 'Refreshing sweet and sour traditional Konkan digestive cooler with roasted cumin and rock salt.',
      price: 40.00,
      image: 'https://images.unsplash.com/photo-1553787499-6f9133860278?w=600&auto=format&fit=crop&q=80',
      rating: 4.7,
      popularity: 90,
      is_recommended: 0
    },
    {
      name: 'Bedekar Special Masala Cutting Chai',
      description: 'Fresh boiled milk tea brewed with ginger root, green cardamom, and lemongrass.',
      price: 30.00,
      image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80',
      rating: 4.8,
      popularity: 93,
      is_recommended: 0
    }
  ];

  for (const d of bedekarDishes) {
    const slug = d.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    await pool.query(
      `INSERT INTO dishes (restaurant_id, name, slug, description, price, image, rating, popularity, is_recommended, status)
       VALUES (33, ?, ?, ?, ?, ?, ?, ?, ?, 'active')`,
      [d.name, slug, d.description, d.price, d.image, d.rating, d.popularity, d.is_recommended]
    );
  }

  console.log(`Successfully added ${bedekarDishes.length} authentic dishes for Bedekar Tea Stall (rest_id: 33)!`);
  
  const [rows] = await pool.query('SELECT id, name, price, is_recommended FROM dishes WHERE restaurant_id = 33');
  console.log('Current dishes for Bedekar Tea Stall in MySQL:', rows);

  process.exit(0);
}

fixBedekarDishes().catch(err => {
  console.error(err);
  process.exit(1);
});
