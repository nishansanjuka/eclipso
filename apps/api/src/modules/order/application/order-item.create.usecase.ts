import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateOrderItemDto } from '../dto/order-item.dto';
import { OrderItemCreateEntity } from '../domain/order.item.entity';
import { OrderWorkflowRepository } from '../infrastructure/order-workflow.repository';
import { assertDraft } from './order-guards';

// as a business owner, I want to add a product to a draft purchase order
@Injectable()
export class OrderItemCreateUsecase {
  constructor(private readonly workflow: OrderWorkflowRepository) {}

  async execute(businessId: string, orderData: CreateOrderItemDto) {
    const data = new OrderItemCreateEntity(orderData);

    return this.workflow.transaction(async (tx) => {
      // The order comes from the request, so it must be proven to be ours.
      const order = await this.workflow.lockOrder(tx, businessId, data.orderId);
      if (!order) throw new NotFoundException('Order not found');
      assertDraft(order);

      const product = await this.workflow.loadProduct(
        tx,
        businessId,
        data.productId,
      );
      if (!product) throw new NotFoundException('Product not found');
      if (product.supplierId !== order.supplierId) {
        throw new BadRequestException(
          "Product does not belong to this order's supplier",
        );
      }
      if (await this.workflow.orderHasProduct(tx, order.id, product.id)) {
        throw new ConflictException(
          'Product is already on this order; update its quantity instead',
        );
      }

      // No stock or ledger change here: that happens once, when the order is received.
      const item = await this.workflow.insertItem(tx, {
        orderId: order.id,
        productId: product.id,
        qty: data.qty,
        price: data.price,
      });
      await this.workflow.recomputeTotal(tx, order.id);
      return item;
    });
  }
}
