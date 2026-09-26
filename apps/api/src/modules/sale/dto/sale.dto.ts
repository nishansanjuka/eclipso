import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethodEnum } from '../../payment/infrastructure/enums/payment.enum';

/**
 * Checkout request. Prices, totals, quantities of the sale and payment status
 * are deliberately NOT accepted: the server computes them from the catalog.
 */
export class CreateSaleItemDto {
  @ApiProperty({ format: 'uuid' })
  productId: string;
  @ApiPropertyOptional({ format: 'uuid' })
  discountId?: string;
  @ApiPropertyOptional({ format: 'uuid' })
  taxId?: string;
  @ApiProperty({ minimum: 1 })
  qty: number;
}

export class CreateSalePaymentDto {
  @ApiProperty({ enum: PaymentMethodEnum })
  method: PaymentMethodEnum;
  @ApiProperty({
    description: 'Amount tendered, must equal the computed sale total.',
    example: '12.34',
  })
  amount: string;
  @ApiPropertyOptional()
  transactionRef?: string;
}

export class CreateSaleDto {
  @ApiPropertyOptional({ format: 'uuid' })
  customerId?: string;
  @ApiProperty({ type: [CreateSaleItemDto] })
  items: CreateSaleItemDto[];
  @ApiPropertyOptional({ type: CreateSalePaymentDto })
  payment?: CreateSalePaymentDto;
}

export class UpdateSaleDto {
  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  customerId?: string | null;
}

export class VoidSaleDto {
  @ApiProperty({ description: 'Why the sale is being voided.' })
  reason: string;
}
