const fs = require('fs');

let routeContent = fs.readFileSync('app/api/ai/dish-image/route.ts', 'utf8');

const start = routeContent.indexOf('function matchDishToCanonicalKey(');
const end = routeContent.indexOf('async function processFoodImageToPurePng(');
let funcCode = routeContent.slice(start, end);

// Strip basic TypeScript types
funcCode = funcCode.replace(/:\s*string\b/g, '');
funcCode = funcCode.replace(/:\s*Record<[^>]+>/g, '');

const fn = new Function(funcCode + '\nreturn matchDishToCanonicalKey;')();

const dishesToTest = [
  // Pizza items
  { dish: "Pizza Fire", rest: "Pizza Fire" },
  { dish: "Fire Pizza", rest: "Fire Pizza" },
  { dish: "Wood Fired Pizza", rest: "Wood Fired Pizza" },
  { dish: "Wood Fired Margherita Pizza", rest: "Pizzeria" },
  { dish: "Farmhouse Pizza", rest: "Domino's Pizza" },
  { dish: "Peppy Paneer Pizza", rest: "Domino's Pizza" },
  { dish: "Fiery Peri Peri Chicken Pizza", rest: "Pizza Hut" },
  { dish: "Pepperoni Pizza", rest: "Pizza Hut" },
  { dish: "Cheesy Garlic Breadsticks", rest: "Pizza Hut" },
  { dish: "Garlic Bread with Cheese", rest: "Domino's" },

  // KFC items
  { dish: "KFC Hot & Crispy Fried Chicken (4 Pcs)", rest: "KFC" },
  { dish: "KFC Fried Chicken Bucket", rest: "KFC" },
  { dish: "Fried Chicken", rest: "KFC" },
  { dish: "KFC Classic Zinger Burger", rest: "KFC" },
  { dish: "Zinger Burger", rest: "KFC" },
  { dish: "Crispy Chicken Popcorn Large", rest: "KFC" },
  { dish: "Chicken Popcorn", rest: "KFC" },
  { dish: "Crispy Boneless Chicken Strips", rest: "KFC" },
  { dish: "Hot & Crispy Chicken Wings", rest: "KFC" },
  { dish: "KFC Peri Peri Chicken Strips", rest: "KFC" },

  // Fries items
  { dish: "Crispy French Fries", rest: "KFC" },
  { dish: "Peri Peri Fries", rest: "KFC" },
  { dish: "Cheesy Fries", rest: "Cafe" }
];

console.log('--- CURRENT MATCHING TEST ---');
for (const item of dishesToTest) {
  const key = fn(item.dish, item.rest);
  console.log(`"${item.dish}" (${item.rest}) -> key: "${key}"`);
}
