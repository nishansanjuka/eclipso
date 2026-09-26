import { Module } from '@nestjs/common';
import { Pool } from 'pg';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import { loadConfig } from '../config';
import * as schema from './schema';

@Module({
  providers: [
    {
      provide: 'DRIZZLE_CLIENT',
      useFactory: () => {
        const pool = new Pool({
          connectionString: loadConfig().DATABASE_URL,
          // Timestamps are `timestamp without time zone`. Pinning the session
          // to UTC makes `now()` defaults and JS dates agree, so reports that
          // bucket by day mean the same thing wherever the database server is.
          options: '-c timezone=UTC',
        });
        const db = drizzle({
          client: pool,
          schema,
        });
        return db;
      },
    },
  ],
  exports: ['DRIZZLE_CLIENT'], // Export for injection
})
export class DatabaseModule {}
export type DrizzleClient = NodePgDatabase<typeof schema> & {
  $client: Pool;
};

/** Either the pool-backed client or an open transaction. */
export type DbExecutor =
  | DrizzleClient
  | Parameters<Parameters<DrizzleClient['transaction']>[0]>[0];
