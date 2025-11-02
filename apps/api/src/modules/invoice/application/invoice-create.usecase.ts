import { Injectable } from '@nestjs/common/decorators/core/injectable.decorator';
import { InvoiceService } from '../infrastructure/invoice.service';
import { InvoiceCreateDto } from '../dto/invoice.dto';

@Injectable()
export class InvoiceCreateUsecase {
  constructor(private readonly invoiceService: InvoiceService) {}

  // as a user I can create an invoice
  async execute(invoiceData: InvoiceCreateDto) {
    return this.invoiceService.createInvoice(invoiceData);
  }
}
