// scripts/clean-runtime-import.mjs
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const dir = path.resolve("../eclipso/packages/api-client-ts/models");

fs.readdirSync(dir).forEach((file) => {
  if (file.endsWith(".ts")) {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, "utf8");
    // remove the import line
    content = content.replace(
      /import { mapValues } from '..\/runtime';\n/g,
      ""
    );
    fs.writeFileSync(filePath, content, "utf8");
  }
});
console.log("Removed runtime imports ✅");

// Fix __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to models directory (relative to scripts/)
const modelsDir = path.join(__dirname, "../packages/api-client-ts/models");

// Read all model files
const files = fs.readdirSync(modelsDir).filter((f) => f.endsWith(".ts"));

// Generate index.ts content
const indexContent = files
  .map((f) => `export * from './models/${f.replace(".ts", "")}';`)
  .join("\n");

// Write index.ts in package root
fs.writeFileSync(
  path.join(__dirname, "../packages/api-client-ts/index.ts"),
  indexContent
);

console.log(
  "✅ Created index.ts for api-client-ts and removed runtime imports"
);
