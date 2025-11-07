import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CreatePaymentDto } from '../../payment/dto/payment.dto';

export class CreateSaleItemDto {
  id?: string;
  saleId?: string;
  @ApiProperty()
  productId: string;
  @ApiPropertyOptional()
  discountId?: string;
  @ApiPropertyOptional()
  taxId?: string;
  @ApiProperty()
  qty: number;
  @ApiProperty()
  price: string;
}

export class CreateSaleDto {
  id?: string;
  businessId: string;
  @ApiPropertyOptional()
  customerId?: string;
  @ApiProperty()
  totalAmount: string;
  @ApiProperty()
  qty: number;
  @ApiProperty({ type: [CreateSaleItemDto] })
  items: CreateSaleItemDto[];
  @ApiPropertyOptional({ type: CreatePaymentDto })
  payment?: CreatePaymentDto;
}
