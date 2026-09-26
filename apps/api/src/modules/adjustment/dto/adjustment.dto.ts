import { ApiProperty } from '@nestjs/swagger';

export class CreateAdjustmentDto {
  id?: string;

  businessId: string;

  branchId: string;

  /** Clerk id of the user who made the adjustment. */
  userId: string;

  @ApiProperty()
  reason: string;
}

export class UpdateAdjustmentDto {
  id?: string;

  @ApiProperty({ required: false })
  reason?: string;
}
