import { Inject, Injectable } from '@nestjs/common';
import { type DrizzleClient } from 'src/shared/database/drizzle.module';
import { businesses } from './schema/business.schema';
import { businessUsers } from '../../../shared/database/relations/business.user.schema';
import { eq } from 'drizzle-orm';
import { BusinessDto } from '../dto/business.dto';

@Injectable()
export class BusinessRepository {
  constructor(@Inject('DRIZZLE_CLIENT') private readonly db: DrizzleClient) {}

  async createBusiness(businessData: BusinessDto) {
    const [business] = await this.db
      .insert(businesses)
      .values(businessData)
      .returning();

    await this.db.insert(businessUsers).values({
      businessId: business.orgId,
      userClerkId: businessData.createdBy,
    });
  }

  async updateBusiness(updateData: Partial<BusinessDto>) {
    await this.db
      .update(businesses)
      .set(updateData)
      .where(eq(businesses.orgId, updateData.orgId!));
  }

  async deleteBusiness(businessId: string) {
    await this.db.delete(businesses).where(eq(businesses.orgId, businessId));
  }
}
