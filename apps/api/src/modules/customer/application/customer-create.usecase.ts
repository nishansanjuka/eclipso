import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateCustomerDto } from '../dto/customer.dto';
import { CustomerService } from '../infrastructure/customer.service';
import { BusinessService } from '../../business/infrastructure/business.service';
import { CustomerCreateEntity } from '../domain/customer.entity';

@Injectable()
// as a business admin I can add new customers to the organization
export class CustomerCreateUseCase {
  constructor(
    private readonly customerService: CustomerService,
    private readonly businessService: BusinessService,
  ) {}

  async execute(
    orgId: string,
    customerData: Omit<CreateCustomerDto, 'businessId'>,
  ) {
    const res = await this.businessService.getBusinessWithUserByOrgId(orgId);

    if (!res) {
      throw new NotFoundException(`Business not found`);
    } else {
      const { id } = res;
      const data = new CustomerCreateEntity({
        ...customerData,
        businessId: id,
      });
      return this.customerService.createCustomer(data);
    }
  }
}
