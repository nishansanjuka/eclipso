import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  PaymentMethodEnum,
  PaymentStatusEnum,
} from '../infrastructure/enums/payment.enum';

export class CreatePaymentDto {
  id?: string;
  saleId?: string;
  @ApiProperty({ enum: PaymentMethodEnum })
  method: PaymentMethodEnum;
  @ApiProperty()
  amount: string;
  @ApiProperty({ enum: PaymentStatusEnum })
  status: PaymentStatusEnum;
  @ApiPropertyOptional()
  transactionRef?: string;
}
