import { Injectable } from '@nestjs/common';
import { CreateTaxDto, UpdateTaxDto } from '../dto/tax.dto';
import { TaxRepository } from './tax.repository';

@Injectable()
export class TaxService {
  constructor(private readonly taxRepository: TaxRepository) {}

  async createTax(taxData: CreateTaxDto) {
    return this.taxRepository.createTax(taxData);
  }

  async findTaxByNumber(taxNumber: string) {
    return this.taxRepository.findTaxById(taxNumber);
  }

  async findTaxById(id: string) {
    return this.taxRepository.findTaxById(id);
  }

  async updateTax(id: string, taxData: UpdateTaxDto) {
    return this.taxRepository.updateTax(id, taxData);
  }

  async deleteTax(id: string, businessId: string) {
    return this.taxRepository.deleteTax(id, businessId);
  }
}
