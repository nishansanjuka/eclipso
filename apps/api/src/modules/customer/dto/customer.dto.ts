import { ApiProperty } from '@nestjs/swagger';

export class CreateCustomerDto {
  id?: string;
  businessId: string;
  @ApiProperty()
  name: string;
  @ApiProperty()
  phone: string;
  @ApiProperty()
  email: string;
}
