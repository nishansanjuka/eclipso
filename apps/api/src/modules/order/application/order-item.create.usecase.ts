import { Injectable } from '@nestjs/common/decorators/core/injectable.decorator';
import { OrderItemService } from '../infrastructure/order-item.service';
import { OrderItemCreateEntity } from '../domain/order.item.entity';
import { CreateOrderItemDto } from '../dto/order-item.dto';
import { NotFoundException } from '@nestjs/common';
import { ProductService } from '../../product/infrastructure/product.service';
import { InventoryMovementService } from '../../inventory/infrastructure/inventory.movements.service';
import { InventoryMovementTypeEnum } from '../../inventory/infrastructure/enums/inventory.movement.enum';

// as an business owner, I want to create a new order item
@Injectable()
export class OrderItemCreateUsecase {
  constructor(
    private readonly orderItemService: OrderItemService,
    private readonly productService: ProductService,
    private readonly inventoryMovementService: InventoryMovementService,
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
    await this.inventoryMovementService.create({
      productId: orderItem.productId,
      qty: orderData.qty,
      orderId: orderData.orderId,
      movementType: InventoryMovementTypeEnum.PURCHASE,
    });
    return await this.orderItemService.createOrderItem(orderItem);
  }
}
