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
        const pool = new Pool({ connectionString: loadConfig().DATABASE_URL });
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
