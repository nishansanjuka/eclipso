import { Inject, Injectable } from '@nestjs/common';
import { and, asc, desc, eq, inArray, sql } from 'drizzle-orm';
import {
  type DbExecutor,
  type DrizzleClient,
} from '../../../shared/database/drizzle.module';
import { branches } from './schema/branch.schema';

@Injectable()
export class BranchRepository {
  constructor(@Inject('DRIZZLE_CLIENT') private readonly db: DrizzleClient) {}

  /** Serializes branch changes of one business (default-branch switches). */
  withBusinessLock<T>(
    businessId: string,
    fn: (tx: DbExecutor) => Promise<T>,
  ): Promise<T> {
    return this.db.transaction(async (tx) => {
      await tx.execute(
        sql`select pg_advisory_xact_lock(hashtext(${'branches:' + businessId}))`,
      );
      return fn(tx);
    });
  }

  /** `restrictedIds` null = every branch of the business. */
  list(businessId: string, restrictedIds: readonly string[] | null) {
    return this.db
      .select()
      .from(branches)
      .where(
        and(
          eq(branches.businessId, businessId),
          restrictedIds ? inArray(branches.id, [...restrictedIds]) : undefined,
        ),
      )
      .orderBy(desc(branches.isDefault), asc(branches.name));
  }

  async findById(tx: DbExecutor, businessId: string, id: string) {
    const [row] = await tx
      .select()
      .from(branches)
      .where(and(eq(branches.id, id), eq(branches.businessId, businessId)));
    return row;
  }

  async insert(tx: DbExecutor, values: typeof branches.$inferInsert) {
    const [row] = await tx.insert(branches).values(values).returning();
    return row;
  }

  async update(
    tx: DbExecutor,
    id: string,
    set: Partial<typeof branches.$inferInsert>,
  ) {
    const [row] = await tx
      .update(branches)
      .set({ ...set, updatedAt: new Date() })
      .where(eq(branches.id, id))
      .returning();
    return row;
  }

  async clearDefault(tx: DbExecutor, businessId: string) {
    await tx
      .update(branches)
      .set({ isDefault: false, updatedAt: new Date() })
      .where(
        and(eq(branches.businessId, businessId), eq(branches.isDefault, true)),
      );
  }
}
