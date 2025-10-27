import { Injectable, NotFoundException } from '@nestjs/common';
import { BusinessDto } from '../dto/business.dto';
import { BusinessRepository } from './business.repository';

@Injectable()
export class BusinessService {
  constructor(private readonly businessRepository: BusinessRepository) {}

  async createBusiness(businessData: BusinessDto) {
    return this.businessRepository.createBusiness(businessData);
  }

  async updateBusiness(businessData: Partial<BusinessDto>) {
    return this.businessRepository.updateBusiness(businessData);
  }

  async deleteBusiness(businessId: string) {
    return this.businessRepository.deleteBusiness(businessId);
  }

  async getBusinessWithUserByOrgId(orgId: string) {
    const res = await this.businessRepository.getBusinessWithUserByOrgId(orgId);
    if (!res) {
      throw new NotFoundException(`Business with orgId "${orgId}" not found`);
    } else return res;
  }
}
