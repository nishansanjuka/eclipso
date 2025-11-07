import { Injectable, NotFoundException } from '@nestjs/common';
import { CustomerService } from '../infrastructure/customer.service';
import { BusinessService } from '../../business/infrastructure/business.service';

@Injectable()
// as a business admin I can delete customers from the organization
export class CustomerDeleteUseCase {
  constructor(
    private readonly customerService: CustomerService,
    private readonly businessService: BusinessService,
  ) {}

  async execute(id: string, orgId: string) {
    const res = await this.businessService.getBusinessWithUserByOrgId(orgId);

    if (!res) {
      throw new NotFoundException(`Business not found`);
    } else {
      const { id: businessId } = res;
      return this.customerService.deleteCustomer(id, businessId);
    }
  }
}
