import { Injectable } from '@nestjs/common';
import { DiscountRepository } from './discount.repository';
import { CreateDiscountDto, UpdateDiscountDto } from '../dto/discount.dto';

@Injectable()
export class DiscountService {
  constructor(private readonly discountRepository: DiscountRepository) {}

  async createDiscount(discountData: CreateDiscountDto) {
    return this.discountRepository.createDiscount(discountData);
  }

  async findDiscountByNumber(discountNumber: string) {
    return this.discountRepository.findDiscountById(discountNumber);
  }

  async findDiscountById(id: string) {
    return this.discountRepository.findDiscountById(id);
  }

  async updateDiscount(id: string, discountData: UpdateDiscountDto) {
    return this.discountRepository.updateDiscount(id, discountData);
  }

  async deleteDiscount(id: string, businessId: string) {
    return this.discountRepository.deleteDiscount(id, businessId);
  }
}
