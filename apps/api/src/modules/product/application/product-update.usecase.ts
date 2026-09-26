import { Injectable, NotFoundException } from '@nestjs/common';
import { BusinessService } from '../../business/infrastructure/business.service';
import { ProductService } from '../infrastructure/product.service';
import { ProductUpdateEntity } from '../domain/product.entity';
import { UpdateProductDto } from '../dto/product.dto';

@Injectable()
export class ProductUpdateUseCase {
  constructor(
    private readonly productService: ProductService,
    private readonly businessService: BusinessService,
  ) {}

  // as business owner, update product category
  async execute(id: string, orgId: string, productData: UpdateProductDto) {
    const res = await this.businessService.getBusinessWithUserByOrgId(orgId);

    if (!res) {
      throw new NotFoundException(`Business not found`);
    } else {
      const { id: businessId } = res;
      await this.productService.assertReferencesInBusiness(businessId, {
        brandId: productData.brandId,
      });
      const data = new ProductUpdateEntity(productData);
      const updated = await this.productService.updateProduct(
        id,
        businessId,
        data,
      );
      if (!updated) throw new NotFoundException('Product not found');
      return updated;
    }
  }
}
