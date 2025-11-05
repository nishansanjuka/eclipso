import { ApiProperty } from '@nestjs/swagger';

export class OrderItemDiscountDto {
  @ApiProperty()
  discountId: string;
  @ApiProperty()
  orderItemId: string;
}
