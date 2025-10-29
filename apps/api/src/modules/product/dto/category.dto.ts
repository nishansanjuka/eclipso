import { ApiProperty } from '@nestjs/swagger';

export class CategoryCreateDto {
  id?: string;
  businessId: string;
  @ApiProperty()
  name: string;
  @ApiProperty()
  parentId?: string;
}

export class CategoryUpdateDto {
  id: string;
  businessId: string;
  @ApiProperty()
  name?: string;
  @ApiProperty()
  parentId?: string;
}

export class CategoryDeleteDto {
  id: string;
  @ApiProperty()
  businessId: string;
}
