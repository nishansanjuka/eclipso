import { Inject, Injectable } from '@nestjs/common';
import { type DrizzleClient } from 'src/shared/database/drizzle.module';
import { suppliers } from './schema/supplier.schema';
import { CreateSupplierDto } from '../dto/supplier.dto';
import { and, eq } from 'drizzle-orm';

@Injectable()
export class SupplierRepository {
  constructor(@Inject('DRIZZLE_CLIENT') private readonly db: DrizzleClient) {}

  async createSupplier(supplierData: CreateSupplierDto) {
    return await this.db.insert(suppliers).values(supplierData).returning();
  }

  async updateSupplierWithBusinessId(
    id: string,
    businessId: string,
    supplierData: Partial<CreateSupplierDto>,
  ) {
    return await this.db
      .update(suppliers)
      .set(supplierData)
      .where(and(eq(suppliers.id, id), eq(suppliers.businessId, businessId)));
  }

  async deleteSupplierWithBusinessId(id: string, businessId: string) {
    return await this.db
      .delete(suppliers)
      .where(and(eq(suppliers.id, id), eq(suppliers.businessId, businessId)));
  }
}
