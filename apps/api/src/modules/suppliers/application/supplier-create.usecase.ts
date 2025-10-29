import { Injectable, NotFoundException } from '@nestjs/common';
import { SupplierCreateDto } from '../dto/supplier.dto';
import { SupplierService } from '../infrastructure/supplier.service';
import { BusinessService } from '../../business/infrastructure/business.service';
import { SuppplierCreateEntity } from '../domain/supplier.entity';

@Injectable()
// as a business admin I can add new suppliers to the organization
export class SupplierCreateUseCase {
  constructor(
    private readonly supplierService: SupplierService,
    private readonly businessService: BusinessService,
  ) {}

  async execute(
    orgId: string,
    supplierData: Omit<SupplierCreateDto, 'businessId'>,
  ) {
    const res = await this.businessService.getBusinessWithUserByOrgId(orgId);

    if (!res) {
      throw new NotFoundException(`Business not found`);
    } else {
      const { id } = res;
      const data = new SuppplierCreateEntity({
        ...supplierData,
        businessId: id,
      });
      return this.supplierService.createSupplier(data);
    }
  }
}
