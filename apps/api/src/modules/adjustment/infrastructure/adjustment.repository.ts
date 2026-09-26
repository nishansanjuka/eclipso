import { Inject, Injectable } from '@nestjs/common';
import { type DrizzleClient } from '../../../shared/database/drizzle.module';
import { UpdateAdjustmentDto } from '../dto/adjustment.dto';
import { adjustments } from './schema/adjustment.schema';
import { and, desc, eq } from 'drizzle-orm';
import { type DbExecutor } from '../../../shared/database/drizzle.module';
import { type BranchScope } from '../../auth/domain/auth-context';
import { branchScopeCondition } from '../../../shared/utils/branch-filter';

@Injectable()
export class AdjustmentRepository {
  constructor(@Inject('DRIZZLE_CLIENT') private readonly db: DrizzleClient) {}

  async insert(tx: DbExecutor, values: typeof adjustments.$inferInsert) {
    const [result] = await tx.insert(adjustments).values(values).returning();
    return result;
  }

  async findById(id: string, businessId: string, scope: BranchScope) {
    const [result] = await this.db
      .select()
      .from(adjustments)
      .where(
        and(
          eq(adjustments.id, id),
          eq(adjustments.businessId, businessId),
          branchScopeCondition(adjustments.branchId, scope),
        ),
      )
      .limit(1)
      .execute();
    return result;
  }

  async findByBusinessId(businessId: string, scope: BranchScope) {
    return await this.db
      .select()
      .from(adjustments)
      .where(
        and(
          eq(adjustments.businessId, businessId),
          branchScopeCondition(adjustments.branchId, scope),
        ),
      )
      .orderBy(desc(adjustments.createdAt))
      .execute();
  }

  async findByBusinessAndUser(
    businessId: string,
    userId: string,
    scope: BranchScope,
  ) {
    return await this.db
      .select()
      .from(adjustments)
      .where(
        and(
          eq(adjustments.businessId, businessId),
          eq(adjustments.userId, userId),
          branchScopeCondition(adjustments.branchId, scope),
        ),
      )
      .orderBy(desc(adjustments.createdAt))
      .execute();
  }

  async update(
    id: string,
    businessId: string,
    data: UpdateAdjustmentDto,
    scope: BranchScope,
  ) {
    const [result] = await this.db
      .update(adjustments)
      .set({ ...data, updatedAt: new Date() })
      .where(
        and(
          eq(adjustments.id, id),
          eq(adjustments.businessId, businessId),
          branchScopeCondition(adjustments.branchId, scope),
        ),
      )
      .returning();
    return result;
  }

  async delete(id: string, businessId: string, scope: BranchScope) {
    const [result] = await this.db
      .delete(adjustments)
      .where(
        and(
          eq(adjustments.id, id),
          eq(adjustments.businessId, businessId),
          branchScopeCondition(adjustments.branchId, scope),
        ),
      )
      .returning();
    return result;
  }

  async getAll(businessId: string, scope: BranchScope, limit?: number) {
    const query = this.db
      .select()
      .from(adjustments)
      .where(
        and(
          eq(adjustments.businessId, businessId),
          branchScopeCondition(adjustments.branchId, scope),
        ),
      )
      .orderBy(desc(adjustments.createdAt));

    if (limit) {
      return query.limit(limit).execute();
    }

    return query.execute();
  }
}
