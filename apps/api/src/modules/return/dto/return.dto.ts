import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  RefundMethodEnum,
  ReturnReasonEnum,
  ReturnStatusEnum,
} from '../infrastructure/enums/return.enum';

export class CreateReturnItemDto {
  id?: string;
  returnId?: string;
  @ApiProperty()
  saleItemId: string;
  @ApiProperty()
  qtyReturned: number;
}

export class CreateRefundDto {
  id?: string;
  returnId?: string;
  userId?: string;
  @ApiProperty({ enum: RefundMethodEnum })
  method: RefundMethodEnum;
  @ApiProperty()
  amount: string;
  @ApiPropertyOptional()
  reason?: string;
  @ApiPropertyOptional()
  transactionRef?: string;
}

export class CreateReturnDto {
  id?: string;
  @ApiProperty()
  saleId: string;
  userId?: string;
  @ApiProperty()
  qty: number;
  @ApiProperty({ enum: ReturnReasonEnum })
  reason: ReturnReasonEnum;
  @ApiProperty({ enum: ReturnStatusEnum })
  status: ReturnStatusEnum;
  @ApiPropertyOptional()
  notes?: string;
  @ApiProperty({ type: [CreateReturnItemDto] })
  items: CreateReturnItemDto[];
  @ApiPropertyOptional({ type: CreateRefundDto })
  refund?: CreateRefundDto;
}
