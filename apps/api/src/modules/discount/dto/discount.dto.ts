import { ApiProperty } from '@nestjs/swagger';
import { DiscountType } from '../enums/discount.types.enum';

export class CreateDiscountDto {
  id?: string;
  businessId: string;
  @ApiProperty()
  name: string;
  @ApiProperty()
  value: number;
  @ApiProperty()
  type: DiscountType;
  @ApiProperty()
  start: Date;
  @ApiProperty()
  end: Date;
  @ApiProperty()
  isActive?: boolean;
}

export class UpdateDiscountDto {
  id?: string;
  businessId: string;
  @ApiProperty({ required: false })
  name?: string;
  @ApiProperty({ required: false })
  value?: number;
  @ApiProperty({ required: false })
  type?: DiscountType;
  @ApiProperty({ required: false })
  start?: Date;
  @ApiProperty({ required: false })
  end?: Date;
  @ApiProperty({ required: false })
  isActive?: boolean;
}
