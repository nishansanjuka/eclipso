import { ApiProperty } from '@nestjs/swagger';

export class OrderItemTaxDto {
  @ApiProperty()
  taxId: string;
  @ApiProperty()
  orderItemId: string;
}
