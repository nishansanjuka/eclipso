import { Inject, Injectable } from '@nestjs/common';
import { type DrizzleClient } from 'src/shared/database/drizzle.module';
import { BusinessCreateDto } from '../dto/business.dto';
import { businesses } from './schema/business.schema';
import { businessUsers } from '../../../shared/database/relations/business.user.schema';

@Injectable()
export class BusinessRepository {
  constructor(@Inject('DRIZZLE_CLIENT') private readonly db: DrizzleClient) {}

  async createBusiness(businessData: BusinessCreateDto) {
    const [business] = await this.db
      .insert(businesses)
      .values(businessData)
      .returning();

    await this.db.insert(businessUsers).values({
      businessId: business.id,
      userClerkId: businessData.createdBy,
    });
  }
}
