import { Injectable, NotFoundException } from '@nestjs/common';
import { BusinessService } from '../../business/infrastructure/business.service';
import { ProductService } from '../infrastructure/product.service';
import { ProductCreateEntity } from '../domain/product.entity';
import { CreateProductDto } from '../dto/product.dto';

@Injectable()
export class ProductCreateUseCase {
  constructor(
    private readonly productService: ProductService,
    private readonly businessService: BusinessService,
  ) {}

  // as business owner, create product category
  async execute(orgId: string, productData: CreateProductDto) {
    const res = await this.businessService.getBusinessWithUserByOrgId(orgId);

    if (!res) {
      throw new NotFoundException(`Business not found`);
    } else {
      const { id } = res;
      const data = new ProductCreateEntity({
        ...productData,
        businessId: id,
      });
      return this.productService.createProduct(data);
    }
  }
}
