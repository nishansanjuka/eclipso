import { Injectable } from '@nestjs/common';
import { InvoiceRepository } from './invoice.repository';
import { InvoiceCreateDto, InvoiceUpdateDto } from '../dto/invoice.dto';

@Injectable()
export class InvoiceService {
  constructor(private readonly invoiceRepository: InvoiceRepository) {}

  async createInvoice(invoiceData: InvoiceCreateDto) {
    return this.invoiceRepository.createInvoice(invoiceData);
  }

  async findInvoiceByNumber(invoiceNumber: string) {
    return this.invoiceRepository.findInvoiceByNumber(invoiceNumber);
  }

  async findInvoiceById(id: string) {
    return this.invoiceRepository.findInvoiceById(id);
  }

  async updateInvoice(id: string, invoiceData: InvoiceUpdateDto) {
    return this.invoiceRepository.updateInvoice(id, invoiceData);
  }

  async deleteInvoice(id: string) {
    return this.invoiceRepository.deleteInvoice(id);
  }

  async getInvoiceDataById(invoiceId: string) {
    return await this.invoiceRepository.getInvoiceDataById(invoiceId);
  }
}
