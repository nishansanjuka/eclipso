import { Injectable } from '@nestjs/common';
import { BusinessCreateDto } from '../dto/business.dto';
import { BusinessRepository } from './business.repository';

@Injectable()
export class BusinessService {
  constructor(private readonly businessRepository: BusinessRepository) {}

  async createBusiness(businessData: BusinessCreateDto) {
    return this.businessRepository.createBusiness(businessData);
  }
}
