import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateSaleDto } from '../dto/sale.dto';
import { SaleCheckoutRepository } from '../infrastructure/sale-checkout.repository';
import { SaleCreateEntity } from '../domain/sale.entity';
import {
  PricingLineInput,
  priceSale,
  toDecimal,
  toMinor,
} from '../domain/sale-pricing';
import { type DbExecutor } from '../../../shared/database/drizzle.module';
import { InventoryMovementTypeEnum } from '../../inventory/infrastructure/enums/inventory.movement.enum';
import { PaymentStatusEnum } from '../../payment/infrastructure/enums/payment.enum';

const IDEMPOTENCY_KEY = /^[A-Za-z0-9._:-]{8,128}$/;
const IDEMPOTENCY_INDEX = 'sales_business_idempotency_uq';

/**
 * Checkout. Everything the client sends is treated as a *request*; prices,
 * discounts, taxes, totals, the cashier, the receipt number and the payment
 * status are all decided here from the database.
 *
 * All writes share one transaction: if any step fails, nothing is kept.
 */
@Injectable()
export class SaleCreateUseCase {
  constructor(private readonly checkout: SaleCheckoutRepository) {}

  async execute(
    businessId: string,
    cashierClerkId: string,
    saleData: CreateSaleDto,
    idempotencyKey?: string,
  ) {
    if (idempotencyKey !== undefined && !IDEMPOTENCY_KEY.test(idempotencyKey)) {
      throw new BadRequestException(
        'Idempotency-Key must be 8-128 characters of letters, digits, . _ : -',
      );
    }

    const entity = new SaleCreateEntity(saleData);

    try {
      return await this.checkout.transaction((tx) =>
        this.run(tx, businessId, cashierClerkId, entity, idempotencyKey),
      );
    } catch (error) {
      // Two identical requests raced past the pre-check: the loser hits the
      // unique index and gets the winner's sale.
      if (idempotencyKey && this.isIdempotencyConflict(error)) {
        return await this.checkout.transaction((tx) =>
          this.replay(tx, businessId, idempotencyKey),
        );
      }
      throw error;
    }
  }

  private async replay(tx: DbExecutor, businessId: string, key: string) {
    const existing = await this.checkout.findByIdempotencyKey(
      tx,
      businessId,
      key,
    );
    if (!existing) throw new NotFoundException('Sale not found');
    return {
      ...(await this.checkout.loadBundle(tx, existing.id)),
      replayed: true,
    };
  }

  private async run(
    tx: DbExecutor,
    businessId: string,
    cashierClerkId: string,
    entity: SaleCreateEntity,
    idempotencyKey?: string,
  ) {
    if (idempotencyKey) {
      const existing = await this.checkout.findByIdempotencyKey(
        tx,
        businessId,
        idempotencyKey,
      );
      if (existing) return this.replay(tx, businessId, idempotencyKey);
    }

    // ── 1. Read and validate (no locks held yet) ───────────────────────────
    const productIds = [...new Set(entity.items.map((i) => i.productId))];
    const taxIds = this.distinct(entity.items.map((i) => i.taxId));
    const discountIds = this.distinct(entity.items.map((i) => i.discountId));

    const [productRows, taxRows, discountRows] = await Promise.all([
      this.checkout.loadProducts(tx, businessId, productIds),
      this.checkout.loadTaxes(tx, businessId, taxIds),
      this.checkout.loadDiscounts(tx, businessId, discountIds),
    ]);
    const productById = new Map(productRows.map((p) => [p.id, p]));
    const taxById = new Map(taxRows.map((t) => [t.id, t]));
    const discountById = new Map(discountRows.map((d) => [d.id, d]));

    for (const id of productIds) {
      if (!productById.has(id)) {
        throw new NotFoundException(`Product with ID ${id} not found`);
      }
    }
    for (const id of taxIds) {
      const tax = taxById.get(id);
      if (!tax) throw new NotFoundException(`Tax with ID ${id} not found`);
      if (!tax.isActive) {
        throw new BadRequestException(`Tax "${tax.name}" is not active`);
      }
    }
    const now = new Date();
    for (const id of discountIds) {
      const discount = discountById.get(id);
      if (!discount) {
        throw new NotFoundException(`Discount with ID ${id} not found`);
      }
      if (!discount.isActive || discount.start > now || discount.end < now) {
        throw new BadRequestException(
          `Discount "${discount.name}" is not currently valid`,
        );
      }
    }

    if (
      entity.customerId &&
      !(await this.checkout.customerExists(tx, businessId, entity.customerId))
    ) {
      throw new NotFoundException(
        `Customer with ID ${entity.customerId} not found`,
      );
    }

    // ── 2. Price the sale from the catalog ─────────────────────────────────
    const lineInputs: PricingLineInput[] = entity.items.map((item) => {
      const tax = item.taxId ? taxById.get(item.taxId) : undefined;
      const discount = item.discountId
        ? discountById.get(item.discountId)
        : undefined;
      return {
        unitPriceMinor: productById.get(item.productId)!.price,
        qty: item.qty,
        tax: tax && { type: tax.type, value: tax.rate },
        discount: discount && { type: discount.type, value: discount.value },
      };
    });
    const priced = priceSale(lineInputs);

    if (
      entity.payment &&
      toMinor(entity.payment.amount) !== priced.totalMinor
    ) {
      throw new BadRequestException(
        `Payment amount must equal the sale total (${toDecimal(priced.totalMinor)})`,
      );
    }

    // ── 3. Write. Lock order is always business row, then products (sorted
    //       by id), so concurrent checkouts cannot deadlock. ────────────────
    const cashierId = await this.checkout.findUserIdByClerkId(
      tx,
      cashierClerkId,
    );
    const seq = await this.checkout.nextSaleNumber(tx, businessId);

    const qtyByProduct = new Map<string, number>();
    for (const item of entity.items) {
      qtyByProduct.set(
        item.productId,
        (qtyByProduct.get(item.productId) ?? 0) + item.qty,
      );
    }
    for (const productId of [...qtyByProduct.keys()].sort()) {
      const qty = qtyByProduct.get(productId)!;
      if (!(await this.checkout.takeStock(tx, businessId, productId, qty))) {
        const product = productById.get(productId)!;
        throw new BadRequestException(
          `Insufficient stock for product ${product.name}. Required: ${qty}`,
        );
      }
    }

    const sale = await this.checkout.insertSale(tx, {
      businessId,
      customerId: entity.customerId ?? null,
      userId: cashierId ?? null,
      receiptNumber: `S-${String(seq).padStart(6, '0')}`,
      idempotencyKey: idempotencyKey ?? null,
      subTotal: toDecimal(priced.subTotalMinor),
      totalDiscount: toDecimal(priced.totalDiscountMinor),
      totalTax: toDecimal(priced.totalTaxMinor),
      totalAmount: toDecimal(priced.totalMinor),
      qty: entity.items.reduce((sum, i) => sum + i.qty, 0),
    });

    const items = await this.checkout.insertItems(
      tx,
      entity.items.map((item, i) => ({
        saleId: sale.id,
        productId: item.productId,
        discountId: item.discountId ?? null,
        taxId: item.taxId ?? null,
        qty: item.qty,
        price: toDecimal(lineInputs[i].unitPriceMinor),
        discountAmount: toDecimal(priced.lines[i].discountMinor),
        taxAmount: toDecimal(priced.lines[i].taxMinor),
      })),
    );

    const movements = await this.checkout.insertMovements(
      tx,
      items.map((item) => ({
        productId: item.productId,
        saleId: sale.id,
        qty: -item.qty,
        movementType: InventoryMovementTypeEnum.SALE,
      })),
    );

    const payment = entity.payment
      ? await this.checkout.insertPayment(tx, {
          saleId: sale.id,
          method: entity.payment.method,
          amount: toDecimal(priced.totalMinor),
          // Set here, never taken from the request.
          status: PaymentStatusEnum.COMPLETED,
          transactionRef: entity.payment.transactionRef ?? null,
        })
      : null;

    return { sale, items, inventoryMovements: movements, payment };
  }

  private distinct(ids: (string | null | undefined)[]): string[] {
    return [...new Set(ids.filter((id): id is string => !!id))];
  }

  private isIdempotencyConflict(error: unknown): boolean {
    let current: unknown = error;
    for (let depth = 0; current && depth < 4; depth++) {
      const e = current as {
        code?: string;
        constraint?: string;
        cause?: unknown;
      };
      if (e.code === '23505' && e.constraint === IDEMPOTENCY_INDEX) return true;
      current = e.cause;
    }
    return false;
  }
}
