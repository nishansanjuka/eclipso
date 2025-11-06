import { Injectable } from '@nestjs/common/decorators/core/injectable.decorator';
import { OrderItemService } from '../infrastructure/order-item.service';
import { NotFoundException } from '@nestjs/common';
import { InventoryMovementService } from '../../inventory/infrastructure/inventory.movements.service';

// as an business owner, I want to delete existing order item
@Injectable()
export class OrderItemDeleteUsecase {
  constructor(
    private readonly orderItemService: OrderItemService,
    private readonly inventoryMovementService: InventoryMovementService,
  ) {}

  async execute(id: string, orgId: string) {
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

    await this.inventoryMovementService.delete(inventoryRes.id);
    return await this.orderItemService.deleteOrderItem(id);
  }
}
