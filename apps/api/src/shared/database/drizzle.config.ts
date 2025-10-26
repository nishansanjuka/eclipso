import { defineConfig } from 'drizzle-kit';
import { loadConfig } from '../config';

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/shared/database/schema.ts',
  out: './src/shared/database/migrations',
  dbCredentials: {
    url: loadConfig().DATABASE_URL,
  },
});
