import { ApiProperty } from '@nestjs/swagger';

export class OrderItemCreateDto {
  id?: string;
  @ApiProperty()
  orderId: string;
  @ApiProperty()
  productId: string;
  @ApiProperty()
  qty: number;
  @ApiProperty()
  price: number;
  @ApiProperty()
  tax: number;
  @ApiProperty()
  discount: number;
}
