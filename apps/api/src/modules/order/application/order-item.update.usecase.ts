import { Injectable } from '@nestjs/common/decorators/core/injectable.decorator';
import { OrderItemService } from '../infrastructure/order-item.service';
import { OrderItemUpdateEntity } from '../domain/order.item.entity';
import { UpdateOrderItemDto } from '../dto/order-item.dto';
import { NotFoundException } from '@nestjs/common';
import { InventoryMovementService } from '../../inventory/infrastructure/inventory.movements.service';

// as an business owner, I want to update existing order item
@Injectable()
export class OrderItemUpdateUsecase {
  constructor(
    private readonly orderItemService: OrderItemService,
    private readonly inventoryMovementService: InventoryMovementService,
  ) {}

  async execute(id: string, orgId: string, orderData: UpdateOrderItemDto) {
    const res = await this.orderItemService.validateOrderItemOwnership(
      id,
      orgId,
    );

    if (!res) {
      throw new NotFoundException(
        'Order item not found for the authorized organization',
      );
    }
    const orderItemRes = await this.orderItemService.getOrderItemsById(id);
    const inventoryRes =
      await this.inventoryMovementService.getByOrderAndProductId(
        orderItemRes.orderId,
        orderItemRes.productId,
      );

    const orderItem = new OrderItemUpdateEntity(orderData);
    await this.inventoryMovementService.update(inventoryRes.id, {
      qty: orderData.qty,
    });
    return await this.orderItemService.updateOrderItem(id, orderItem);
  }
}
