// scripts/patch-postman.mjs
import fs from 'fs';
import path from 'path';

const tempPath = process.env.TEMP || process.env.TMP;
const collectionPath = path.join(tempPath, 'collection.json');
const preRequestScriptPath = path.resolve('./scripts/pre-request.js'); // or .txt if you used .js

console.log('🔧 Reading collection:', collectionPath);

if (!fs.existsSync(collectionPath)) {
  console.error('❌ Collection not found at', collectionPath);
  process.exit(1);
}

if (!fs.existsSync(preRequestScriptPath)) {
  console.error('❌ Pre-request script not found at', preRequestScriptPath);
  process.exit(1);
}

const collection = JSON.parse(fs.readFileSync(collectionPath, 'utf-8'));
const preScript = fs.readFileSync(preRequestScriptPath, 'utf-8');

// --- Inject pre-request script globally ---
collection.event = collection.event || [];

// Remove any existing pre-request events to avoid duplication
collection.event = collection.event.filter((e) => e.listen !== 'prerequest');

// Add our script
collection.event.push({
  listen: 'prerequest',
  script: {
    type: 'text/javascript',
    exec: preScript.split('\n'),
  },
});

fs.writeFileSync(collectionPath, JSON.stringify(collection, null, 2));
console.log('✅ Postman collection patched with pre-request script!');
