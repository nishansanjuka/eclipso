import { ApiProperty } from '@nestjs/swagger';

export class InvoiceCreateDto {
  id?: string;
  @ApiProperty()
  invoiceNumber: string;
  @ApiProperty()
  totalTax: number;
  @ApiProperty()
  totalDiscount: number;
  @ApiProperty()
  subTotal: number;
  @ApiProperty()
  grandTotal: number;
  @ApiProperty()
  pdfUrl: string;
}

export class InvoiceUpdateDto {
  id?: string;
  @ApiProperty({ required: false })
  invoiceNumber?: string;
  @ApiProperty({ required: false })
  totalTax?: number;
  @ApiProperty({ required: false })
  totalDiscount?: number;
  @ApiProperty({ required: false })
  subTotal?: number;
  @ApiProperty({ required: false })
  grandTotal?: number;
  @ApiProperty({ required: false })
  pdfUrl?: string;
}
