import { Inject, Injectable } from '@nestjs/common';
import { type DrizzleClient } from 'src/shared/database/drizzle.module';
import { customers } from './schema/customer.schema';
import { CreateCustomerDto } from '../dto/customer.dto';
import { and, eq } from 'drizzle-orm';

@Injectable()
export class CustomerRepository {
  constructor(@Inject('DRIZZLE_CLIENT') private readonly db: DrizzleClient) {}

  async createCustomer(customerData: CreateCustomerDto) {
    return await this.db.insert(customers).values(customerData).returning();
  }

  async updateCustomerWithBusinessId(
    id: string,
    businessId: string,
    customerData: Partial<CreateCustomerDto>,
  ) {
    return await this.db
      .update(customers)
      .set(customerData)
      .where(and(eq(customers.id, id), eq(customers.businessId, businessId)));
  }

  async deleteCustomerWithBusinessId(id: string, businessId: string) {
    return await this.db
      .delete(customers)
      .where(and(eq(customers.id, id), eq(customers.businessId, businessId)));
  }
}
