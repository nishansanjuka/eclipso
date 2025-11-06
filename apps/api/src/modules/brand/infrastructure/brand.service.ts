import { Injectable } from '@nestjs/common';
import { CreateBrandDto, UpdateBrandDto } from '../dto/brand';
import { BrandRepository } from './brand.repository';

@Injectable()
export class BrandService {
  constructor(private readonly brandRepository: BrandRepository) {}

  async createBrand(brandData: CreateBrandDto) {
    return this.brandRepository.createBrand(brandData);
  }

  async findBrandBySlug(slug: string) {
    return this.brandRepository.findBrandBySlug(slug);
  }

  async findBrandById(id: string) {
    return this.brandRepository.findBrandById(id);
  }

  async updateBrand(id: string, businessId: string, brandData: UpdateBrandDto) {
    return this.brandRepository.updateBrand(id, businessId, brandData);
  }

  async deleteBrand(id: string, businessId: string) {
    return this.brandRepository.deleteBrand(id, businessId);
  }
}
