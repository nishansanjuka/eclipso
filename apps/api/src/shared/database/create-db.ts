import { Client } from 'pg';
import { ConnectionOptions, parse } from 'pg-connection-string';
import { loadConfig } from '../config';
import * as dotenv from 'dotenv';
import { logDebug } from '@eclipso/utils/logdebug';
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
      logDebug(`⚙️ Database "${dbName}" does not exist. Creating...`);
      await client.query(`CREATE DATABASE "${dbName}";`);
      logDebug(`✅ Database "${dbName}" created successfully.`);
    } else {
      logDebug(`✅ Database "${dbName}" already exists.`);
    }
  } catch (error) {
    logDebug('❌ Error checking/creating database:', error);
  } finally {
    await client.end();
  }
}

(async () => {
  await ensureDatabase();
})();
