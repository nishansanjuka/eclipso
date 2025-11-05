import { Injectable } from '@nestjs/common/decorators/core/injectable.decorator';
import { OrderItemService } from '../infrastructure/order-item.service';
import { OrderItemCreateEntity } from '../domain/order.item.entity';
import { CreateOrderItemDto } from '../dto/order-item.dto';
import { NotFoundException } from '@nestjs/common';
import { ProductService } from '../../product/infrastructure/product.service';

// as an business owner, I want to create a new order item
@Injectable()
export class OrderItemCreateUsecase {
  constructor(
    private readonly orderItemService: OrderItemService,
    private readonly productService: ProductService,
  ) {}

  async execute(orgId: string, orderData: CreateOrderItemDto) {
    const res = await this.productService.getProductIdByIdAndOrgId(
      orderData.productId,
      orgId,
    );

    if (!res.productId) {
      throw new NotFoundException(
        'Product not found for the authorized organization',
      );
    }

    const orderItem = new OrderItemCreateEntity(orderData);
    return await this.orderItemService.createOrderItem(orderItem);
  }
}
