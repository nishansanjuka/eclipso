/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Client } from 'pg';
import { ConnectionOptions, parse } from 'pg-connection-string';
import { loadConfig } from '../config';
import * as dotenv from 'dotenv';
dotenv.config();

async function ensureDatabase() {
  // Parse database URL
  const config: ConnectionOptions = parse(loadConfig().DATABASE_URL);
  const dbName = config.database;
  const { host, port, user, password } = config;

  if (!dbName) throw new Error('Database name missing in DATABASE_URL');

  // Connect to the default "postgres" database
  const client = new Client({
    host: host as string,
    port: Number(port),
    user: user as string,
    password: password as string,
    database: 'postgres',
  });

  try {
    await client.connect();
    const res = await client.query(
      `SELECT 1 FROM pg_database WHERE datname = '${dbName}'`,
    );

    if (res.rowCount === 0) {
      console.log(`⚙️ Database "${dbName}" does not exist. Creating...`);
      await client.query(`CREATE DATABASE "${dbName}";`);
      console.log(`✅ Database "${dbName}" created successfully.`);
    } else {
      console.log(`✅ Database "${dbName}" already exists.`);
    }
  } catch (error) {
    console.error('❌ Error checking/creating database:', error);
  } finally {
    await client.end();
  }
}

(async () => {
  await ensureDatabase();
})();
