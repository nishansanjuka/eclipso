import { ConflictException } from '@nestjs/common';
import { OrderStatus } from '../infrastructure/enums/order.enum';

/** Items, dates and cancellation can only change while the order is a draft. */
export function assertDraft(order: { status: OrderStatus }) {
  if (order.status !== OrderStatus.DRAFT) {
    throw new ConflictException(
      `Order is ${order.status}; only draft orders can be changed`,
    );
  }
}
