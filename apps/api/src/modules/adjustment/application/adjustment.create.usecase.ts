import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AdjustmentRepository } from '../infrastructure/adjustment.repository';
import { AdjustmentCreateEntity } from '../domain/adjustment.entity';
import { InventoryMovementTypeEnum } from '../../inventory/infrastructure/enums/inventory.movement.enum';
import { BranchStockRepository } from '../../inventory/infrastructure/branch-stock.repository';
import { SaleCheckoutRepository } from '../../sale/infrastructure/sale-checkout.repository';

const MAX_ADJUSTMENT = 1_000_000;

/**
 * Manual stock correction (count, damage, shrinkage) at one branch.
 *
 * The adjustment record, the ledger entry and the stock change commit together
 * or not at all, and stock can never go below zero: removing more than the
 * branch holds is rejected instead of clamped.
 */
@Injectable()
export class AdjustmentCreateUsecase {
  constructor(
    private readonly adjustments: AdjustmentRepository,
    private readonly checkout: SaleCheckoutRepository,
    private readonly stock: BranchStockRepository,
  ) {}

  async execute(
    productId: string,
    quantity: number,
    data: { reason: string },
    businessId: string,
    branchId: string,
    clerkId: string,
  ) {
    if (
      !Number.isInteger(quantity) ||
      quantity === 0 ||
      Math.abs(quantity) > MAX_ADJUSTMENT
    ) {
      throw new BadRequestException(
        `Quantity must be a non-zero whole number (at most ${MAX_ADJUSTMENT} either way)`,
      );
    }

    const entity = new AdjustmentCreateEntity({
      businessId,
      branchId,
      userId: clerkId,
      reason: data.reason,
    });

    return this.checkout.transaction(async (tx) => {
      await this.stock.assertBranchOperable(tx, businessId, branchId);

      const [product] = await this.checkout.loadProducts(tx, businessId, [
        productId,
      ]);
      if (!product) {
        throw new NotFoundException(`Product with ID ${productId} not found`);
      }

      const adjustment = await this.adjustments.insert(tx, {
        businessId: entity.businessId,
        branchId: entity.branchId,
        userId: entity.userId,
        reason: entity.reason,
      });

      const applied =
        quantity > 0
          ? await this.stock.add(tx, branchId, productId, quantity)
          : await this.stock.take(tx, branchId, productId, -quantity);
      if (!applied) {
        throw new BadRequestException(
          `Cannot remove ${-quantity} of ${product.name}: this branch does not hold that many.`,
        );
      }

      await this.checkout.insertMovements(tx, [
        {
          branchId,
          productId,
          adjustmentId: adjustment.id,
          qty: quantity,
          movementType: InventoryMovementTypeEnum.ADJUSTMENT,
        },
      ]);

      return adjustment;
    });
  }
}
