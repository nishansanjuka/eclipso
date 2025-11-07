import { ApiProperty } from '@nestjs/swagger';

export class CreateAdjustmentDto {
  @ApiProperty({ required: false })
  id?: string;

  @ApiProperty()
  businessId: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  reason: string;
}

export class UpdateAdjustmentDto {
  @ApiProperty({ required: false })
  id?: string;

  @ApiProperty({ required: false })
  reason?: string;
}

export class AdjustmentExecuteDto {
  @ApiProperty({ description: 'Product ID to adjust inventory for' })
  productId: string;

  @ApiProperty({
    description: 'Quantity to adjust (positive or negative)',
    example: -5,
  })
  quantity: number;

  @ApiProperty({
    description: 'Reason for the adjustment',
    minLength: 3,
    maxLength: 500,
  })
  reason: string;
}
