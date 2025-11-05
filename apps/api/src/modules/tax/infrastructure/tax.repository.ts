import { Inject, Injectable } from '@nestjs/common';
import { type DrizzleClient } from '../../../shared/database/drizzle.module';
import { CreateTaxDto, UpdateTaxDto } from '../dto/tax.dto';
import { taxes } from './schema/tax.schema';
import { and, eq } from 'drizzle-orm/sql/expressions/conditions';

@Injectable()
export class TaxRepository {
  constructor(@Inject('DRIZZLE_CLIENT') private readonly db: DrizzleClient) {}

  async createTax(data: CreateTaxDto) {
    const result = await this.db.insert(taxes).values(data).returning();
    return result;
  }

  async findTaxById(id: string) {
    const [result] = await this.db
      .select()
      .from(taxes)
      .where(eq(taxes.id, id))
      .limit(1)
      .execute();
    return result;
  }

  async getTaxById(taxId: string) {
    const [result] = await this.db
      .select()
      .from(taxes)
      .where(eq(taxes.id, taxId))
      .limit(1);
    return result;
  }

  async updateTax(id: string, data: UpdateTaxDto) {
    const result = await this.db
      .update(taxes)
      .set(data)
      .where(eq(taxes.id, id))
      .returning();
    return result;
  }

  async deleteTax(id: string, businessId: string) {
    const result = await this.db
      .delete(taxes)
      .where(and(eq(taxes.id, id), eq(taxes.businessId, businessId)))
      .returning();
    return result;
  }
}
