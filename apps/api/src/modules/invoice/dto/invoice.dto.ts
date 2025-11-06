import { ApiProperty } from '@nestjs/swagger';

export class InvoiceCreateDto {
  id?: string;
  @ApiProperty()
  invoiceNumber?: string;
  @ApiProperty()
  totalTax?: string;
  @ApiProperty()
  totalDiscount?: string;
  @ApiProperty()
  subTotal?: string;
  @ApiProperty()
  grandTotal?: string;
}

export class InvoiceUpdateDto {
  id?: string;
  @ApiProperty({ required: false })
  invoiceNumber?: string;
  @ApiProperty({ required: false })
  totalTax?: string;
  @ApiProperty({ required: false })
  totalDiscount?: string;
  @ApiProperty({ required: false })
  subTotal?: string;
  @ApiProperty({ required: false })
  grandTotal?: string;
  @ApiProperty({ required: false })
  pdfUrl?: string;
}
