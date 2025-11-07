import { ApiProperty } from '@nestjs/swagger';

export class CreateAdjustmentDto {
  id?: string;

  businessId: string;

  userId: string;

  @ApiProperty()
  reason: string;
}

export class UpdateAdjustmentDto {
  id?: string;

  @ApiProperty({ required: false })
  reason?: string;
}
