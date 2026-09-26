import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  RefundMethodEnum,
  ReturnReasonEnum,
} from '../infrastructure/enums/return.enum';

/**
 * Return request. Quantities of the return, the refund amount, the status and
 * the cashier are NOT accepted: the server derives them from the original sale.
 */
export class CreateReturnItemDto {
  @ApiProperty({ format: 'uuid' })
  saleItemId: string;
  @ApiProperty({ minimum: 1 })
  qtyReturned: number;
}

export class CreateRefundDto {
  @ApiProperty({ enum: RefundMethodEnum })
  method: RefundMethodEnum;
  @ApiPropertyOptional()
  reason?: string;
  @ApiPropertyOptional()
  transactionRef?: string;
}

export class CreateReturnDto {
  @ApiProperty({ format: 'uuid' })
  saleId: string;
  @ApiProperty({ enum: ReturnReasonEnum })
  reason: ReturnReasonEnum;
  @ApiPropertyOptional()
  notes?: string;
  @ApiProperty({ type: [CreateReturnItemDto] })
  items: CreateReturnItemDto[];
  @ApiPropertyOptional({
    type: CreateRefundDto,
    description:
      'Record how the customer is refunded. The amount is computed from what was paid for the returned units.',
  })
  refund?: CreateRefundDto;
}
