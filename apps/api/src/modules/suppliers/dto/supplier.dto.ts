import { ApiProperty } from '@nestjs/swagger';

export class SupplierCreateDto {
  id?: string;
  businessId: string;
  @ApiProperty()
  name: string;
  @ApiProperty()
  contact: string;
  @ApiProperty()
  description: string;
}
