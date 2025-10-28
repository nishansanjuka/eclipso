import { Injectable } from '@nestjs/common';
import { SupplierRepository } from './supplier.repository';
import { SupplierCreateDto } from '../dto/supplier.dto';

@Injectable()
export class SupplierService {
  constructor(private readonly supplierRepository: SupplierRepository) {}

  async createSupplier(supplierData: SupplierCreateDto) {
    return await this.supplierRepository.createSupplier(supplierData);
  }

  async updateSupplier(
    id: string,
    businessId: string,
    supplierData: Partial<SupplierCreateDto>,
  ) {
    return await this.supplierRepository.updateSupplierWithBusinessId(
      id,
      businessId,
      supplierData,
    );
  }

  async deleteSupplier(id: string, businessId: string) {
    return await this.supplierRepository.deleteSupplierWithBusinessId(
      id,
      businessId,
    );
  }
}
