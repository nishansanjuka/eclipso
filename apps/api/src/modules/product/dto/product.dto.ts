import { ApiProperty } from '@nestjs/swagger';

export class ProductCreateDto {
  id?: string;
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
  @ApiProperty({ required: false })
  metadata?: object;
}

export class ProductUpdateDto {
  id?: string;
  businessId: string;
  @ApiProperty({ required: false })
  name?: string;
  @ApiProperty({ required: false })
  sku?: string;
  @ApiProperty({ required: false })
  price?: number;
  @ApiProperty({ required: false })
  stockQty?: number;
  @ApiProperty({ required: false })
  metadata?: object;
}
