const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Read app/api/ai/dish-image/route.ts
const routeContent = fs.readFileSync(path.join(__dirname, '../app/api/ai/dish-image/route.ts'), 'utf8');

// Helper to extract an object from code
function extractObject(varName) {
  const reg = new RegExp(`const ${varName}: Record<string, string> = \\{([\\s\\S]*?)\\n\\};`);
  const match = routeContent.match(reg);
  if (!match) throw new Error('Not found: ' + varName);
  const obj = {};
  const lines = match[1].split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('//') || !trimmed.includes(':')) continue;
    const parts = trimmed.split(':');
    const key = parts[0].trim().replace(/^['"]|['"]$/g, '');
    const val = parts.slice(1).join(':').trim().replace(/,$/, '').replace(/^['"]|['"]$/g, '');
    obj[key] = val;
  }
  return obj;
}

const CANONICAL_LOCAL_ASSETS = extractObject('CANONICAL_LOCAL_ASSETS');
const CANONICAL_REMOTE_PHOTOS = extractObject('CANONICAL_REMOTE_PHOTOS');

function isPureVegRestaurantName() { return false; }

// Extract matchDishToCanonicalKey
const fnStart = routeContent.indexOf('function matchDishToCanonicalKey');
const fnEnd = routeContent.indexOf('function resolveDishPhotoUrl');
let fnCode = routeContent.substring(fnStart, fnEnd);
fnCode = fnCode.replace(/:\s*string/g, '').replace(/:\s*boolean/g, '');

const evalMatcher = new Function(fnCode + '\nreturn matchDishToCanonicalKey;');
const matcher = evalMatcher();

// Exact getRawFoodImageBuffer logic
async function getRawBuffer(canonicalKey) {
  const localFileName = CANONICAL_LOCAL_ASSETS[canonicalKey];
  if (localFileName) {
    const baseName = localFileName.replace(/\.(jpg|jpeg)$/i, '');
    const webpPath = path.join(process.cwd(), 'public', 'images', 'food', `${baseName}.webp`);
    const localFilePath = path.join(process.cwd(), 'public', 'images', 'food', localFileName);
    if (fs.existsSync(webpPath)) {
      return { buf: await fs.promises.readFile(webpPath), source: `LOCAL_WEBP: ${baseName}.webp` };
    } else if (fs.existsSync(localFilePath)) {
      return { buf: await fs.promises.readFile(localFilePath), source: `LOCAL_JPG: ${localFileName}` };
    }
  }
  return { buf: null, source: 'NOT_FOUND_LOCALLY' };
}

// Circular cutout check like route.ts
async function makeCutout(buf) {
  const size = 320;
  const radius = size / 2 - 4;
  const maskSvg = Buffer.from(
    `<svg width="${size}" height="${size}">
      <defs>
        <radialGradient id="featherMask" cx="50%" cy="50%" r="50%">
          <stop offset="92%" stop-color="white" stop-opacity="1" />
          <stop offset="100%" stop-color="white" stop-opacity="0" />
        </radialGradient>
      </defs>
      <circle cx="${size / 2}" cy="${size / 2}" r="${radius}" fill="url(#featherMask)" />
    </svg>`
  );

  return await sharp(buf)
    .resize(size, size, { fit: 'cover', position: 'center' })
    .composite([{ input: maskSvg, blend: 'dest-in' }])
    .modulate({ saturation: 1.12, brightness: 1.02 })
    .sharpen({ sigma: 1.1 })
    .webp({ quality: 82, alphaQuality: 90, effort: 4 })
    .toBuffer();
}

async function run() {
  const testDishes = [
    // 1. User specific Bhel requests
    'special ooli bhel',
    'dahi ooli bhel',
    'masala bhadanga bhel',
    'ooli bhel',
    'oli bhel',
    'dahi oli bhel',
    'bhadang bhel',

    // 2. User specific Dosa requests
    'loni sponge dosa',
    'sponge dosa',
    'davangere benne dosa',
    'masala dosa',
    'mysore masala dosa',
    'rava dosa',
    'plain dosa',
    'sada dosa',
    'paper dosa',
    'set dosa',
    'cheese dosa',
    'onion dosa',

    // 3. User specific Uttapa / Uttapam requests
    'onioun uttapa',
    'onion uttapa',
    'uttapa',
    'uttapam',
    'onion uttapam',
    'tomato uttapam'
  ];

  console.log('='.repeat(105));
  console.log('VERIFYING DISH IMAGE CHECKS FOR USER REQUESTED ITEMS');
  console.log('='.repeat(105));

  let allPassed = true;

  for (const dish of testDishes) {
    const key = matcher(dish, '');
    const { buf, source } = await getRawBuffer(key);

    if (!buf) {
      console.error(`[FAIL] ${dish.padEnd(25)} -> Key: ${key.padEnd(18)} -> NO LOCAL FILE FOUND!`);
      allPassed = false;
      continue;
    }

    const cutoutBuf = await makeCutout(buf);
    const meta = await sharp(cutoutBuf).metadata();

    console.log(
      `[PASS] ${dish.padEnd(23)} -> Key: ${key.padEnd(17)} -> ${source.padEnd(30)} -> Cutout: ${cutoutBuf.length} B (${meta.width}x${meta.height}, ${meta.format})`
    );
  }

  console.log('='.repeat(105));
  if (allPassed) {
    console.log('ALL DISH IMAGE CHECKS PASSED WITH 100% VERIFIED LOCAL AUTHENTIC ASSETS!');
  } else {
    console.log('SOME CHECKS FAILED!');
    process.exit(1);
  }
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
