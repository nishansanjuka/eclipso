import { Injectable } from '@nestjs/common';
import { ProductRepository } from './product.repository';
import { ProductCreateDto } from '../dto/product.dto';

@Injectable()
export class ProductService {
  constructor(private readonly productRepository: ProductRepository) {}

  async createProduct(productData: ProductCreateDto) {
    return await this.productRepository.createProduct(productData);
  }

  async updateProduct(
    id: string,
    businessId: string,
    productData: Partial<ProductCreateDto>,
  ) {
    return await this.productRepository.updateProductWithBusinessId(
      id,
      businessId,
      productData,
    );
  }

  async deleteProduct(id: string, businessId: string) {
    return await this.productRepository.deleteProductWithBusinessId(
      id,
      businessId,
    );
  }
}
