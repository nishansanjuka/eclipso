import * as dotenv from 'dotenv';
dotenv.config();

import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';
import { clerkClient } from '@clerk/express';
import { loadConfig } from '../config';
import { users } from '../../modules/users/infrastructure/schema/user.schema';

/**
 * One-off: fills `users.image_url` for members created before the
 * user.updated webhook started capturing it. Safe to re-run.
 */
async function backfill() {
  const pool = new Pool({ connectionString: loadConfig().DATABASE_URL });
  const db = drizzle({ client: pool });

  const rows = await db
    .select({ clerkId: users.clerkId, imageUrl: users.imageUrl })
    .from(users);
  const missing = rows.filter((r) => !r.imageUrl);
  console.log(`${missing.length} of ${rows.length} users need an image_url.`);

  let updated = 0;
  let failed = 0;
  for (const row of missing) {
    try {
      const clerkUser = await clerkClient.users.getUser(row.clerkId);
      if (!clerkUser.imageUrl) continue;
      await db
        .update(users)
        .set({ imageUrl: clerkUser.imageUrl })
        .where(eq(users.clerkId, row.clerkId));
      updated++;
    } catch (error) {
      failed++;
      console.log(`Failed to backfill ${row.clerkId}:`, error);
    }
  }

  console.log(`Done. Updated ${updated}, failed ${failed}.`);
  await pool.end();
}

backfill().catch((error) => {
  console.error(error);
  process.exit(1);
});
