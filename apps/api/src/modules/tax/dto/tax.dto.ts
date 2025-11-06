import { ApiProperty } from '@nestjs/swagger';
import { TaxType } from '../enums/tax.types.enum';

export class CreateTaxDto {
  id?: string;
  businessId: string;
  @ApiProperty()
  name: string;
  @ApiProperty()
  rate: string;
  @ApiProperty()
  type: TaxType;
  @ApiProperty()
  isActive?: boolean;
}

export class UpdateTaxDto {
  id?: string;
  businessId: string;
  @ApiProperty({ required: false })
  name?: string;
  @ApiProperty({ required: false })
  rate?: string;
  @ApiProperty({ required: false })
  type?: TaxType;
  @ApiProperty({ required: false })
  isActive?: boolean;
}
