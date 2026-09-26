import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatus } from '../infrastructure/enums/order.enum';
import { OrderWorkflowRepository } from '../infrastructure/order-workflow.repository';
import { SaleCheckoutRepository } from '../../sale/infrastructure/sale-checkout.repository';
import { BranchStockRepository } from '../../inventory/infrastructure/branch-stock.repository';
import { type BranchScope } from '../../auth/domain/auth-context';
import { InventoryMovementTypeEnum } from '../../inventory/infrastructure/enums/inventory.movement.enum';
import { assertDraft } from './order-guards';

/**
 * Receiving is the only thing that puts purchased stock on the shelf. It runs
 * once per order (the order is locked, and must still be a draft), adds every
 * line to stock, and writes the matching PURCHASE ledger entries, all in one
 * transaction.
 */
@Injectable()
export class OrderReceiveUsecase {
  constructor(
    private readonly workflow: OrderWorkflowRepository,
    private readonly inventory: SaleCheckoutRepository,
    private readonly stock: BranchStockRepository,
  ) {}

  async execute(id: string, businessId: string, scope: BranchScope) {
    return this.workflow.transaction(async (tx) => {
      const order = await this.workflow.lockOrder(tx, businessId, id, scope);
      if (!order) throw new NotFoundException('Order not found');
      assertDraft(order);
      // The goods arrive at the branch the order was placed for.
      await this.stock.assertBranchOperable(tx, businessId, order.branchId);

      const items = await this.workflow.itemsOf(tx, order.id);
      if (items.length === 0) {
        throw new BadRequestException(
          'An order without items cannot be received',
        );
      }

      const qtyByProduct = new Map<string, number>();
      for (const item of items) {
        qtyByProduct.set(
          item.productId,
          (qtyByProduct.get(item.productId) ?? 0) + item.qty,
        );
      }

      // Product-id order keeps the lock order consistent with checkouts.
      for (const productId of [...qtyByProduct.keys()].sort()) {
        const ok = await this.stock.add(
          tx,
          order.branchId,
          productId,
          qtyByProduct.get(productId)!,
        );
        if (!ok) throw new NotFoundException(`Product ${productId} not found`);
      }

      const inventoryMovements = await this.inventory.insertMovements(
        tx,
        [...qtyByProduct.entries()].map(([productId, qty]) => ({
          branchId: order.branchId,
          productId,
          orderId: order.id,
          qty,
          movementType: InventoryMovementTypeEnum.PURCHASE,
        })),
      );

      const received = await this.workflow.updateOrder(tx, order.id, {
        status: OrderStatus.RECEIVED,
      });
      return { order: received, inventoryMovements };
    });
  }
}
