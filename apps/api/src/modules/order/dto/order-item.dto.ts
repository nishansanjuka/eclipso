import { ApiProperty } from '@nestjs/swagger';

export class CreateOrderItemDto {
  id?: string;
  @ApiProperty()
  orderId: string;
  @ApiProperty()
  productId: string;
  @ApiProperty()
  qty: number;
  @ApiProperty()
  price: number;
}

export class UpdateOrderItemDto {
  id?: string;
  @ApiProperty({ required: false })
  qty?: number;
  @ApiProperty({ required: false })
  price?: number;
}
