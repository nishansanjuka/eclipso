import { ApiProperty } from '@nestjs/swagger';

export class CreateBrandDto {
  id?: string;
  @ApiProperty()
  businessId: string;
  @ApiProperty()
  name: string;
  @ApiProperty()
  slug: string;
  @ApiProperty()
  description: string;
  @ApiProperty({ required: false })
  logoUrl?: string;
}

export class UpdateBrandDto {
  id?: string;
  @ApiProperty({ required: false })
  name?: string;
  @ApiProperty({ required: false })
  slug?: string;
  @ApiProperty({ required: false })
  description?: string;
  @ApiProperty({ required: false })
  logoUrl?: string;
}
