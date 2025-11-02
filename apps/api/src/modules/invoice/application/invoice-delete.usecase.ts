import { Injectable } from '@nestjs/common/decorators/core/injectable.decorator';
import { InvoiceService } from '../infrastructure/invoice.service';

@Injectable()
export class InvoiceDeleteUsecase {
  constructor(private readonly invoiceService: InvoiceService) {}

  // as a user I can delete an invoice
  async execute(id: string) {
    return this.invoiceService.deleteInvoice(id);
  }
}
