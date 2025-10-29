import { ApiProperty } from '@nestjs/swagger';

export class ProductCreateDto {
  id?: string;
  @ApiProperty()
  businessId: string;
  @ApiProperty()
  supplierId: string;
  @ApiProperty()
  name: string;
  @ApiProperty()
  sku: string;
  @ApiProperty()
  price: number;
  @ApiProperty()
  stockQty: number;
  @ApiProperty()
  metadata: object;
}
