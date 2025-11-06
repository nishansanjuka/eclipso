import { ApiProperty } from '@nestjs/swagger';

export class CreateSupplierDto {
  id?: string;
  businessId: string;
  @ApiProperty()
  name: string;
  @ApiProperty()
  contact: string;
  @ApiProperty()
  description: string;
}
