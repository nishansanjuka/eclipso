import { ApiProperty } from '@nestjs/swagger';

export class CreateTaxDto {
  id?: string;
  businessId: string;
  @ApiProperty()
  name: string;
  @ApiProperty()
  rate: number;
  @ApiProperty()
  type: string;
  @ApiProperty()
  isActive?: boolean;
}

export class UpdateTaxDto {
  id?: string;
  businessId: string;
  @ApiProperty({ required: false })
  name?: string;
  @ApiProperty({ required: false })
  rate?: number;
  @ApiProperty({ required: false })
  type?: string;
  @ApiProperty({ required: false })
  isActive?: boolean;
}
