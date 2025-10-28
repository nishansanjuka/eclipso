import { Injectable, NotFoundException } from '@nestjs/common';
import { SupplierService } from '../infrastructure/supplier.service';
import { BusinessService } from '../../business/infrastructure/business.service';

@Injectable()
// as a business admin I can delete suppliers from the organization
export class SupplierDeleteUseCase {
  constructor(
    private readonly supplierService: SupplierService,
    private readonly businessService: BusinessService,
  ) {}

  async execute(id: string, orgId: string) {
    const res = await this.businessService.getBusinessWithUserByOrgId(orgId);

    if (!res) {
      throw new NotFoundException(`Business not found`);
    } else {
      const { id: businessId } = res;
      return this.supplierService.deleteSupplier(id, businessId);
    }
  }
}
