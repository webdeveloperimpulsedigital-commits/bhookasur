const fs = require('fs');
const content = fs.readFileSync('lib/liveMenu.ts', 'utf8');

const userRequestedItems = [
  // Street food
  'Pav Bhaji', 'Vada Pav', 'Pani Puri', 'Sev Puri', 'Dahi Puri', 'Bhel Puri', 'Dabeli', 'Ragda Pattice',
  'Misal Pav', 'Samosa', 'Kachori', 'Aloo Tikki', 'Kanda Bhaji', 'Poha', 'Sabudana Vada', 'Momos',
  // Main course
  'Paneer Butter Masala', 'Shahi Paneer', 'Palak Paneer', 'Chole Bhature', 'Rajma Chawal', 'Dal Makhani',
  'Dal Tadka', 'Veg Kolhapuri', 'Mix Veg', 'Aloo Gobi', 'Baingan Bharta', 'Kadhi Pakora', 'Chicken Curry',
  'Butter Chicken', 'Chicken Tikka Masala', 'Mutton Curry', 'Fish Curry', 'Egg Curry', 'Prawn Masala',
  // Rice/Biryani/Pulao
  'Veg Biryani', 'Paneer Biryani', 'Chicken Biryani', 'Mutton Biryani', 'Egg Biryani', 'Veg Pulao',
  'Tawa Pulao', 'Matar Pulao', 'Jeera Rice', 'Fried Rice', 'Lemon Rice', 'Curd Rice',
  // Chinese
  'Hakka Noodles', 'Schezwan Noodles', 'Manchurian', 'Chilli Paneer', 'Chilli Chicken', 'Spring Rolls',
  'American Chopsuey', 'Crispy Corn',
  // South Indian
  'Masala Dosa', 'Mysore Masala Dosa', 'Rava Dosa', 'Uttapam', 'Idli', 'Medu Vada', 'Upma', 'Appam', 'Pongal',
  // Breads
  'Butter Roti', 'Tandoori Roti', 'Butter Naan', 'Garlic Naan', 'Kulcha', 'Aloo Paratha', 'Paneer Paratha',
  // Pizza/Pasta
  'Margherita Pizza', 'Farmhouse Pizza', 'White Sauce Pasta', 'Red Sauce Pasta', 'Lasagna', 'Garlic Bread',
  // Burgers/Sandwiches
  'Veg Burger', 'Chicken Burger', 'Veg Grilled Sandwich', 'Club Sandwich', 'French Fries',
  // Breakfast/Cafe
  'Filter Coffee', 'Cold Coffee', 'Masala Chai', 'Hot Chocolate', 'Brownie', 'Croissant',
  // Desserts
  'Gulab Jamun', 'Rasmalai', 'Jalebi', 'Kaju Katli', 'Modak', 'Shrikhand', 'Basundi', 'Gajar Halwa', 'Kulfi', 'Ice Cream', 'Falooda',
  // Maharashtrian
  'Kothimbir Vadi', 'Thalipeeth', 'Puran Poli', 'Zunka Bhakar', 'Pithla Bhakri', 'Solkadhi'
];

console.log('Auditing presence in lib/liveMenu.ts:');
const missing = [];
for (const item of userRequestedItems) {
  const regex = new RegExp(item.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&'), 'i');
  if (!regex.test(content)) {
    missing.push(item);
  }
}
console.log(`Found: ${userRequestedItems.length - missing.length}/${userRequestedItems.length}`);
console.log('Missing items count:', missing.length);
console.log('Missing items:', missing);
