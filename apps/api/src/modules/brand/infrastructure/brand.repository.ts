import { Inject, Injectable } from '@nestjs/common';
import { type DrizzleClient } from 'src/shared/database/drizzle.module';
import { and, eq } from 'drizzle-orm';
import { CreateBrandDto, UpdateBrandDto } from '../dto/brand';
import { brands } from './schema/brand.schema';

@Injectable()
export class BrandRepository {
  constructor(@Inject('DRIZZLE_CLIENT') private readonly db: DrizzleClient) {}

  async createBrand(data: CreateBrandDto) {
    const [result] = await this.db.insert(brands).values(data).returning();
    return result;
  }

  async findBrandBySlug(slug: string) {
    const result = await this.db
      .select()
      .from(brands)
      .where(eq(brands.slug, slug))
      .limit(1)
      .execute();
    return result;
  }

  async findBrandById(id: string) {
    const result = await this.db
      .select()
      .from(brands)
      .where(eq(brands.id, id))
      .limit(1)
      .execute();
    return result;
  }

  async updateBrand(id: string, businessId: string, data: UpdateBrandDto) {
    const result = await this.db
      .update(brands)
      .set(data)
      .where(and(eq(brands.id, id), eq(brands.businessId, businessId)))
      .returning();
    return result;
  }

  async deleteBrand(id: string, businessId: string) {
    const result = await this.db
      .delete(brands)
      .where(and(eq(brands.id, id), eq(brands.businessId, businessId)))
      .returning();
    return result;
  }
}
