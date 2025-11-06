import { Injectable, NotFoundException } from '@nestjs/common';
import { BusinessService } from '../../business/infrastructure/business.service';
import { ProductService } from '../infrastructure/product.service';

@Injectable()
export class ProductDeleteUseCase {
  constructor(
    private readonly productService: ProductService,
    private readonly businessService: BusinessService,
  ) {}

  // as business owner, delete product
  async execute(id: string, orgId: string) {
    const res = await this.businessService.getBusinessWithUserByOrgId(orgId);

    if (!res) {
      throw new NotFoundException(`Business not found`);
    } else {
      const { id: businessId } = res;
      return this.productService.deleteProduct(id, businessId);
    }
  }
}
