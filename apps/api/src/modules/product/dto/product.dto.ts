import { ApiProperty } from '@nestjs/swagger';

export class CreateProductDto {
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
  brandId?: string;
  @ApiProperty({ required: false })
  metadata?: object;
}

export class UpdateProductDto {
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
  brandId?: string;
  @ApiProperty({ required: false })
  metadata?: object;
}
