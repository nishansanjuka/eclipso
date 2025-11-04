import { Injectable, NotFoundException } from '@nestjs/common';
import { BusinessService } from '../../business/infrastructure/business.service';
import { ProductService } from '../infrastructure/product.service';
import { ProductUpdateEntity } from '../domain/product.entity';
import { ProductUpdateDto } from '../dto/product.dto';

@Injectable()
export class ProductUpdateUseCase {
  constructor(
    private readonly productService: ProductService,
    private readonly businessService: BusinessService,
  ) {}

  // as business owner, update product category
  async execute(id: string, orgId: string, productData: ProductUpdateDto) {
    const res = await this.businessService.getBusinessWithUserByOrgId(orgId);

    if (!res) {
      throw new NotFoundException(`Business not found`);
    } else {
      const { id: businessId } = res;
      const data = new ProductUpdateEntity({
        ...productData,
        businessId: businessId,
      });
      return this.productService.updateProduct(id, businessId, data);
    }
  }
}
