import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateReturnDto } from '../dto/return.dto';
import { ReturnCreateEntity } from '../domain/return.entity';
import { refundForReturnMinor } from '../domain/refund-pricing';
import { ReturnCheckoutRepository } from '../infrastructure/return-checkout.repository';
import { ReturnStatusEnum } from '../infrastructure/enums/return.enum';
import { SaleCheckoutRepository } from '../../sale/infrastructure/sale-checkout.repository';
import { BranchStockRepository } from '../../inventory/infrastructure/branch-stock.repository';
import { type BranchScope } from '../../auth/domain/auth-context';
import { SaleStatusEnum } from '../../sale/infrastructure/enums/sale.enum';
import { toDecimal } from '../../sale/domain/sale-pricing';
import { InventoryMovementTypeEnum } from '../../inventory/infrastructure/enums/inventory.movement.enum';

/**
 * Processes a return against an existing sale.
 *
 * The sale row is locked first, so concurrent returns of the same sale are
 * serialized and the "already returned" check cannot be raced. Quantity,
 * refund amount, status and cashier are all derived here, never trusted from
 * the request. One transaction: stock, ledger, return and refund commit
 * together or not at all.
 */
@Injectable()
export class ReturnCreateUseCase {
  constructor(
    private readonly sales: SaleCheckoutRepository,
    private readonly returnsRepo: ReturnCheckoutRepository,
    private readonly stock: BranchStockRepository,
  ) {}

  async execute(
    businessId: string,
    cashierClerkId: string,
    returnData: CreateReturnDto,
    scope: BranchScope,
  ) {
    const entity = new ReturnCreateEntity(returnData);

    return this.sales.transaction(async (tx) => {
      const sale = await this.sales.lockSale(tx, businessId, entity.saleId);
      if (!sale || !scope.canAccessBranch(sale.branchId)) {
        throw new NotFoundException('Sale not found');
      }
      if (sale.status === SaleStatusEnum.VOIDED) {
        throw new ConflictException(
          'This sale was voided and cannot be returned',
        );
      }

      const saleItems = await this.sales.loadSaleItems(tx, sale.id);
      const itemById = new Map(saleItems.map((i) => [i.id, i]));
      const alreadyReturned = await this.returnsRepo.returnedQtyBySaleItem(
        tx,
        entity.items.map((i) => i.saleItemId),
      );

      // Validate every line and price the refund from what was actually paid.
      let refundMinor = 0;
      let totalQty = 0;
      for (const item of entity.items) {
        const line = itemById.get(item.saleItemId);
        if (!line) {
          throw new NotFoundException(
            `Sale item with ID ${item.saleItemId} not found in this sale`,
          );
        }
        const returned = alreadyReturned.get(line.id) ?? 0;
        const remaining = line.qty - returned;
        if (item.qtyReturned > remaining) {
          throw new BadRequestException(
            `Cannot return ${item.qtyReturned} of sale item ${line.id}: ${line.qty} sold, ${returned} already returned, ${remaining} left.`,
          );
        }
        refundMinor += refundForReturnMinor(line, returned, item.qtyReturned);
        totalQty += item.qtyReturned;
      }

      const cashierId = await this.sales.findUserIdByClerkId(
        tx,
        cashierClerkId,
      );
      const returnRecord = await this.returnsRepo.insertReturn(tx, {
        saleId: sale.id,
        userId: cashierId ?? null,
        qty: totalQty,
        reason: entity.reason,
        status: ReturnStatusEnum.COMPLETED,
        notes: entity.notes ?? null,
      });

      const items = await this.returnsRepo.insertItems(
        tx,
        entity.items.map((i) => ({
          returnId: returnRecord.id,
          saleItemId: i.saleItemId,
          qtyReturned: i.qtyReturned,
        })),
      );

      // Restock in product-id order (consistent lock order), summed per product.
      const qtyByProduct = new Map<string, number>();
      for (const item of entity.items) {
        const line = itemById.get(item.saleItemId)!;
        qtyByProduct.set(
          line.productId,
          (qtyByProduct.get(line.productId) ?? 0) + item.qtyReturned,
        );
      }
      for (const productId of [...qtyByProduct.keys()].sort()) {
        // Returned units go back to the branch the sale was made at.
        const ok = await this.stock.add(
          tx,
          sale.branchId,
          productId,
          qtyByProduct.get(productId)!,
        );
        if (!ok) throw new NotFoundException(`Product ${productId} not found`);
      }

      const inventoryMovements = await this.sales.insertMovements(
        tx,
        [...qtyByProduct.entries()].map(([productId, qty]) => ({
          branchId: sale.branchId,
          productId,
          saleId: sale.id,
          qty,
          movementType: InventoryMovementTypeEnum.RETURN,
        })),
      );

      const refund = entity.refund
        ? await this.returnsRepo.insertRefund(tx, {
            returnId: returnRecord.id,
            userId: cashierId ?? null,
            method: entity.refund.method,
            // Computed above, never taken from the request.
            amount: toDecimal(refundMinor),
            reason: entity.refund.reason ?? null,
            transactionRef: entity.refund.transactionRef ?? null,
          })
        : null;

      return {
        return: returnRecord,
        items,
        inventoryMovements,
        refund,
        refundAmount: toDecimal(refundMinor),
      };
    });
  }
}
