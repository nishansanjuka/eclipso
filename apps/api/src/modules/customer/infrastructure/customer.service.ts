import { Injectable } from '@nestjs/common';
import { CustomerRepository } from './customer.repository';
import { CreateCustomerDto } from '../dto/customer.dto';

@Injectable()
export class CustomerService {
  constructor(private readonly customerRepository: CustomerRepository) {}

  async createCustomer(customerData: CreateCustomerDto) {
    return await this.customerRepository.createCustomer(customerData);
  }

  async updateCustomer(
    id: string,
    businessId: string,
    customerData: Partial<CreateCustomerDto>,
  ) {
    return await this.customerRepository.updateCustomerWithBusinessId(
      id,
      businessId,
      customerData,
    );
  }

  async deleteCustomer(id: string, businessId: string) {
    return await this.customerRepository.deleteCustomerWithBusinessId(
      id,
      businessId,
    );
  }
}
