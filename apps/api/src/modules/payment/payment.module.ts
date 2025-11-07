import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../shared/database/drizzle.module';
import { PaymentService } from './infrastructure/payment.service';
import { PaymentRepository } from './infrastructure/payment.repository';

@Module({
  imports: [DatabaseModule],
  providers: [PaymentService, PaymentRepository],
  exports: [PaymentService, PaymentRepository],
})
export class PaymentModule {}
