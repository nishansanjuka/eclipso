// scripts/upload-postman.mjs
import fs from 'fs';
import path from 'path';
import https from 'https';

const tempPath = process.env.TEMP || process.env.TMP;
const collectionPath = path.join(tempPath, 'collection.json');

console.log('📤 Uploading collection to Postman...');

if (!fs.existsSync(collectionPath)) {
  console.error('❌ Collection not found at', collectionPath);
  process.exit(1);
}

const apiKey = process.env.POSTMAN_API_KEY;
const collectionId = process.env.POSTMAN_COLLECTION_ID;

if (!apiKey || !collectionId) {
  console.error('❌ POSTMAN_API_KEY or POSTMAN_COLLECTION_ID not set');
  process.exit(1);
}

const collection = JSON.parse(fs.readFileSync(collectionPath, 'utf-8'));

const payload = JSON.stringify({
  collection: collection,
});

const options = {
  hostname: 'api.getpostman.com',
  path: `/collections/${collectionId}`,
  method: 'PUT',
  headers: {
    'X-Api-Key': apiKey,
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload),
  },
};

const req = https.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    if (res.statusCode === 200) {
      console.log('✅✅✅ Synced NL2SQL collection to Postman!');
    } else {
      console.error(`❌ Upload failed (${res.statusCode}):`, data);
      process.exit(1);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Error uploading to Postman:', error);
  process.exit(1);
});

req.write(payload);
req.end();
