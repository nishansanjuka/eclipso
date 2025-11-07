import { Inject, Injectable } from '@nestjs/common';
import { type DrizzleClient } from '../../../shared/database/drizzle.module';
import {
  CreateAdjustmentDto,
  UpdateAdjustmentDto,
} from '../dto/adjustment.dto';
import { adjustments } from './schema/adjustment.schema';
import { and, desc, eq } from 'drizzle-orm';

@Injectable()
export class AdjustmentRepository {
  constructor(@Inject('DRIZZLE_CLIENT') private readonly db: DrizzleClient) {}

  async create(data: CreateAdjustmentDto) {
    const [result] = await this.db.insert(adjustments).values(data).returning();
    return result;
  }

  async findById(id: string) {
    const [result] = await this.db
      .select()
      .from(adjustments)
      .where(eq(adjustments.id, id))
      .limit(1)
      .execute();
    return result;
  }

  async findByBusinessId(businessId: string) {
    return await this.db
      .select()
      .from(adjustments)
      .where(eq(adjustments.businessId, businessId))
      .orderBy(desc(adjustments.createdAt))
      .execute();
  }

  async findByUserId(userId: string) {
    return await this.db
      .select()
      .from(adjustments)
      .where(eq(adjustments.userId, userId))
      .orderBy(desc(adjustments.createdAt))
      .execute();
  }

  async findByBusinessAndUser(businessId: string, userId: string) {
    return await this.db
      .select()
      .from(adjustments)
      .where(
        and(
          eq(adjustments.businessId, businessId),
          eq(adjustments.userId, userId),
        ),
      )
      .orderBy(desc(adjustments.createdAt))
      .execute();
  }

  async update(id: string, data: UpdateAdjustmentDto) {
    const [result] = await this.db
      .update(adjustments)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(adjustments.id, id))
      .returning();
    return result;
  }

  async delete(id: string, businessId: string) {
    const [result] = await this.db
      .delete(adjustments)
      .where(
        and(eq(adjustments.id, id), eq(adjustments.businessId, businessId)),
      )
      .returning();
    return result;
  }

  async getAll(businessId: string, limit?: number) {
    const query = this.db
      .select()
      .from(adjustments)
      .where(eq(adjustments.businessId, businessId))
      .orderBy(desc(adjustments.createdAt));

    if (limit) {
      return query.limit(limit).execute();
    }

    return query.execute();
  }
}
