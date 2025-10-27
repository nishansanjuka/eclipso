import { Inject, Injectable } from '@nestjs/common';
import { type DrizzleClient } from 'src/shared/database/drizzle.module';
import { suppliers } from './schema/supplier.schema';
import { SupplierCreateDto } from '../dto/supplier.dto';

@Injectable()
export class UserRepository {
  constructor(@Inject('DRIZZLE_CLIENT') private readonly db: DrizzleClient) {}

  async createSupplier(supplierData: SupplierCreateDto) {
    const result = await this.db
      .insert(suppliers)
      .values(supplierData)
      .returning();
    return result;
  }
}
