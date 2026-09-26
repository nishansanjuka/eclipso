import { Injectable } from '@nestjs/common';
import { BusinessDto } from '../dto/business.dto';
import { BusinessRepository } from './business.repository';

@Injectable()
export class BusinessService {
  constructor(private readonly businessRepository: BusinessRepository) {}

  async updateBusiness(businessData: Partial<BusinessDto>) {
    return this.businessRepository.updateBusiness(businessData);
  }

  async getProfile(orgId: string) {
    return this.businessRepository.findProfile(orgId);
  }

  async slugTaken(slug: string) {
    return this.businessRepository.slugTaken(slug);
  }

  async updateProfile(
    orgId: string,
    patch: Partial<BusinessDto>,
    vatRate?: string,
  ) {
    return this.businessRepository.updateProfile(orgId, patch, vatRate);
  }

  async deleteBusiness(businessId: string) {
    return this.businessRepository.deleteBusiness(businessId);
  }

  async getBusinessWithUserByOrgId(orgId: string) {
    return await this.businessRepository.getBusinessWithUserByOrgId(orgId);
  }
}
