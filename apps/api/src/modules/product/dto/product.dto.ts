import { ApiProperty } from '@nestjs/swagger';

export class CreateProductDto {
  businessId: string;
  @ApiProperty()
  supplierId: string;
  @ApiProperty()
  name: string;
  @ApiProperty()
  sku: string;
  @ApiProperty({ required: false, description: 'Unit price in minor units.' })
  price?: number;
  @ApiProperty({
    required: false,
    description:
      'Opening stock. It is recorded as an inventory movement; after creation stock only changes through sales, returns, purchase receiving and adjustments.',
  })
  stockQty?: number;
  @ApiProperty({ required: false })
  brandId?: string;
  @ApiProperty({ required: false })
  metadata?: object;
}

/** Stock is not editable here: use an inventory adjustment. */
export class UpdateProductDto {
  @ApiProperty({ required: false })
  name?: string;
  @ApiProperty({ required: false })
  sku?: string;
  @ApiProperty({ required: false, description: 'Unit price in minor units.' })
  price?: number;
  @ApiProperty({ required: false, nullable: true })
  brandId?: string | null;
  @ApiProperty({ required: false })
  metadata?: object;
}
