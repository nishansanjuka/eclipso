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
