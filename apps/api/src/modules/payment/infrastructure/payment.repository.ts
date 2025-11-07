import { Inject, Injectable } from '@nestjs/common';
import { type DrizzleClient } from 'src/shared/database/drizzle.module';
import { payments } from './schema/payment.schema';
import { CreatePaymentDto } from '../dto/payment.dto';
import { eq } from 'drizzle-orm';

@Injectable()
export class PaymentRepository {
  constructor(@Inject('DRIZZLE_CLIENT') private readonly db: DrizzleClient) {}

  async createPayment(paymentData: CreatePaymentDto & { saleId: string }) {
    return await this.db.insert(payments).values(paymentData).returning();
  }

  async updatePayment(id: string, paymentData: Partial<CreatePaymentDto>) {
    return await this.db
      .update(payments)
      .set(paymentData)
      .where(eq(payments.id, id))
      .returning();
  }

  async deletePayment(id: string) {
    return await this.db.delete(payments).where(eq(payments.id, id));
  }

  async getPaymentById(id: string) {
    const [payment] = await this.db
      .select()
      .from(payments)
      .where(eq(payments.id, id))
      .limit(1);
    return payment;
  }

  async getPaymentBySaleId(saleId: string) {
    const [payment] = await this.db
      .select()
      .from(payments)
      .where(eq(payments.saleId, saleId))
      .limit(1);
    return payment;
  }
}
