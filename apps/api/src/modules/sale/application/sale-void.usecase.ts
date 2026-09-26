import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import z from 'zod';
import { BadRequestException } from '@nestjs/common';
import { VoidSaleDto } from '../dto/sale.dto';
import { SaleCheckoutRepository } from '../infrastructure/sale-checkout.repository';
import { SaleStatusEnum } from '../infrastructure/enums/sale.enum';
import { InventoryMovementTypeEnum } from '../../inventory/infrastructure/enums/inventory.movement.enum';

const voidSchema = z.object({
  reason: z
    .string({ error: 'A void reason is required' })
    .trim()
    .min(3, 'Void reason must be at least 3 characters long')
    .max(500, 'Void reason must be at most 500 characters long'),
});

/**
 * Cancels a completed sale that should not have happened. Sales and their
 * payments are never deleted: the sale is marked voided, every unit goes back
 * on the shelf with a ledger entry, and completed payments are marked refunded.
 *
 * A sale that already has returns cannot be voided (its stock would be
 * restored twice); the returns are the correction path there.
 */
@Injectable()
export class SaleVoidUseCase {
  constructor(private readonly checkout: SaleCheckoutRepository) {}

  async execute(
    saleId: string,
    businessId: string,
    voidedByClerkId: string,
    body: VoidSaleDto,
  ) {
    const parsed = voidSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(
        parsed.error.issues.map((i) => i.message).join(', '),
      );
    }

    return this.checkout.transaction(async (tx) => {
      const sale = await this.checkout.lockSale(tx, businessId, saleId);
      if (!sale) throw new NotFoundException('Sale not found');
      if (sale.status === SaleStatusEnum.VOIDED) {
        throw new ConflictException('Sale is already voided');
      }
      if ((await this.checkout.countLiveReturns(tx, sale.id)) > 0) {
        throw new ConflictException(
          'This sale has returns and cannot be voided',
        );
      }

      const items = await this.checkout.loadSaleItems(tx, sale.id);
      const qtyByProduct = new Map<string, number>();
      for (const item of items) {
        qtyByProduct.set(
          item.productId,
          (qtyByProduct.get(item.productId) ?? 0) + item.qty,
        );
      }

      for (const productId of [...qtyByProduct.keys()].sort()) {
        const ok = await this.checkout.restock(
          tx,
          businessId,
          productId,
          qtyByProduct.get(productId)!,
        );
        if (!ok) throw new NotFoundException(`Product ${productId} not found`);
      }
      const inventoryMovements = await this.checkout.insertMovements(
        tx,
        [...qtyByProduct.entries()].map(([productId, qty]) => ({
          productId,
          saleId: sale.id,
          qty,
          movementType: InventoryMovementTypeEnum.VOID,
        })),
      );

      await this.checkout.markPaymentsRefunded(tx, sale.id);
      const voided = await this.checkout.markVoided(tx, sale.id, {
        voidedBy:
          (await this.checkout.findUserIdByClerkId(tx, voidedByClerkId)) ??
          null,
        voidReason: parsed.data.reason,
      });

      return { sale: voided, inventoryMovements };
    });
  }
}
