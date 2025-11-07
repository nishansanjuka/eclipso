import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateCustomerDto } from '../dto/customer.dto';
import { CustomerService } from '../infrastructure/customer.service';
import { BusinessService } from '../../business/infrastructure/business.service';
import { CustomerUpdateEntity } from '../domain/customer.entity';

@Injectable()
// as a business admin I can update customer information
export class CustomerUpdateUseCase {
  constructor(
    private readonly customerService: CustomerService,
    private readonly businessService: BusinessService,
  ) {}

  async execute(
    id: string,
    orgId: string,
    customerData: Omit<CreateCustomerDto, 'businessId'>,
  ) {
    const res = await this.businessService.getBusinessWithUserByOrgId(orgId);

    if (!res) {
      throw new NotFoundException(`Business not found`);
    } else {
      const { id: businessId } = res;
      const data = new CustomerUpdateEntity({
        ...customerData,
        businessId,
      });
      return this.customerService.updateCustomer(id, businessId, data);
    }
  }
}
