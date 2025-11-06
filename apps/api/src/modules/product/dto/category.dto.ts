import { ApiProperty } from '@nestjs/swagger';

export class CreateCategoryDto {
  id?: string;
  businessId: string;
  @ApiProperty()
  name: string;
  @ApiProperty({ required: false })
  parentId?: string;
}

export class UpdateCategoryDto {
  id: string;
  businessId: string;
  @ApiProperty({ required: false })
  name?: string;
  @ApiProperty({ required: false })
  parentId?: string;
}
