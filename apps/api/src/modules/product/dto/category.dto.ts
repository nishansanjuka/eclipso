import { ApiProperty } from '@nestjs/swagger';

export class CategoryCreateDto {
  id?: string;
  businessId: string;
  @ApiProperty()
  name: string;
  @ApiProperty({ required: false })
  parentId?: string;
}

export class CategoryUpdateDto {
  id: string;
  businessId: string;
  @ApiProperty({ required: false })
  name?: string;
  @ApiProperty({ required: false })
  parentId?: string;
}
