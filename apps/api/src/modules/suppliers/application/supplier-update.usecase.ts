import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateSupplierDto } from '../dto/supplier.dto';
import { SupplierService } from '../infrastructure/supplier.service';
import { BusinessService } from '../../business/infrastructure/business.service';
import { SupplierUpdateEntity } from '../domain/supplier.entity';

@Injectable()
// as a business admin I can update
export class SupplierUpdateUseCase {
  constructor(
    private readonly supplierService: SupplierService,
    private readonly businessService: BusinessService,
  ) {}

  async execute(
    id: string,
    orgId: string,
    supplierData: Omit<CreateSupplierDto, 'businessId'>,
  ) {
    const res = await this.businessService.getBusinessWithUserByOrgId(orgId);

    if (!res) {
      throw new NotFoundException(`Business not found`);
    } else {
      const { id: businessId } = res;
      const data = new SupplierUpdateEntity({
        ...supplierData,
        businessId,
      });
      return this.supplierService.updateSupplier(id, businessId, data);
    }
  }
}
