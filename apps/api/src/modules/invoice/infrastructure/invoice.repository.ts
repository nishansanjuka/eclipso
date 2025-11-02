import { Inject, Injectable } from '@nestjs/common';
import { type DrizzleClient } from 'src/shared/database/drizzle.module';
import { invoices } from './schema/invoice.schema';
import { InvoiceCreateDto, InvoiceUpdateDto } from '../dto/invoice.dto';
import { eq } from 'drizzle-orm';

@Injectable()
export class InvoiceRepository {
  constructor(@Inject('DRIZZLE_CLIENT') private readonly db: DrizzleClient) {}

  async createInvoice(data: InvoiceCreateDto) {
    const result = await this.db.insert(invoices).values(data).returning();
    return result;
  }

  async findInvoiceByNumber(invoiceNumber: string) {
    const result = await this.db
      .select()
      .from(invoices)
      .where(eq(invoices.invoiceNumber, invoiceNumber))
      .limit(1)
      .execute();
    return result;
  }

  async findInvoiceById(id: string) {
    const result = await this.db
      .select()
      .from(invoices)
      .where(eq(invoices.id, id))
      .limit(1)
      .execute();
    return result;
  }

  async updateInvoice(id: string, data: InvoiceUpdateDto) {
    const result = await this.db
      .update(invoices)
      .set(data)
      .where(eq(invoices.id, id))
      .returning();
    return result;
  }

  async deleteInvoice(id: string) {
    const result = await this.db
      .delete(invoices)
      .where(eq(invoices.id, id))
      .returning();
    return result;
  }
}
