import { Injectable } from '@nestjs/common';
import { ProductRepository } from './product.repository';
import { CreateProductDto, UpdateProductDto } from '../dto/product.dto';
import { SQL } from 'drizzle-orm';

@Injectable()
export class ProductService {
  constructor(private readonly productRepository: ProductRepository) {}

  async createProduct(productData: CreateProductDto) {
    return await this.productRepository.createProduct(productData);
  }

  async updateProduct(
    id: string,
    businessId: string,
    productData: UpdateProductDto,
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

  async getProductIdByIdAndOrgId(id: string, orgId: string) {
    return await this.productRepository.getProductIdByIdAndOrgId(id, orgId);
  }

  async updateProductStockBySql(
    productId: string,
    businessId: string,
    stockQtyExpression: SQL,
  ) {
    return await this.productRepository.updateStockBySql(
      productId,
      businessId,
      stockQtyExpression,
    );
  }
}
