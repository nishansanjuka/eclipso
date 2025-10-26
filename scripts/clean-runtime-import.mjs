// scripts/clean-runtime-import.mjs
import fs from 'fs';
import path from 'path';

const dir = path.resolve('./packages/api-client-ts/models');

fs.readdirSync(dir).forEach((file) => {
  if (file.endsWith('.ts')) {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    // remove the import line
    content = content.replace(
      /import { mapValues } from '..\/runtime';\n/g,
      '',
    );
    fs.writeFileSync(filePath, content, 'utf8');
  }
});

console.log('Removed runtime imports ✅');
