import { Injectable } from '@nestjs/common/decorators/core/injectable.decorator';
import { InvoiceService } from '../infrastructure/invoice.service';
import { InvoiceUpdateDto } from '../dto/invoice.dto';

@Injectable()
export class InvoiceUpdateUsecase {
  constructor(private readonly invoiceService: InvoiceService) {}

  // as a user I can create an invoice
  async execute(id: string, invoiceData: InvoiceUpdateDto) {
    return this.invoiceService.updateInvoice(id, invoiceData);
  }
}
