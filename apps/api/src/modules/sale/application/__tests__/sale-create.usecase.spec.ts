import { BadRequestException, NotFoundException } from '@nestjs/common';
import { SaleCreateUseCase } from '../sale-create.usecase';
import { PaymentMethodEnum } from '../../../payment/infrastructure/enums/payment.enum';

const BIZ = 'business-1';
const BRANCH = 'branch-1';
const P1 = '11111111-1111-4111-8111-111111111111';
const P2 = '22222222-2222-4222-8222-222222222222';
const TAX = '33333333-3333-4333-8333-333333333333';
const DISC = '44444444-4444-4444-8444-444444444444';
const CUST = '55555555-5555-4555-8555-555555555555';

const product = (id: string, price: number, name = 'Widget') => ({
  id,
  name,
  price,
  stockQty: 100,
});

describe('SaleCreateUseCase', () => {
  let repo: Record<string, jest.Mock>;
  let stock: Record<string, jest.Mock>;
  let useCase: SaleCreateUseCase;

  beforeEach(() => {
    repo = {
      transaction: jest.fn((fn: (tx: unknown) => unknown) => fn('tx')),
      findByIdempotencyKey: jest.fn().mockResolvedValue(undefined),
      loadBundle: jest.fn(),
      findUserIdByClerkId: jest.fn().mockResolvedValue('user-uuid'),
      loadProducts: jest
        .fn()
        .mockResolvedValue([product(P1, 1000), product(P2, 250, 'Gadget')]),
      loadTaxes: jest.fn().mockResolvedValue([]),
      loadDiscounts: jest.fn().mockResolvedValue([]),
      customerExists: jest.fn().mockResolvedValue(true),
      nextSaleNumber: jest.fn().mockResolvedValue(42),
      insertSale: jest.fn((_tx, v) => Promise.resolve({ id: 'sale-1', ...v })),
      insertItems: jest.fn((_tx, v: any[]) =>
        Promise.resolve(v.map((x, i) => ({ id: `item-${i}`, ...x }))),
      ),
      insertMovements: jest.fn((_tx, v) => Promise.resolve(v)),
      insertPayment: jest.fn((_tx, v) =>
        Promise.resolve({ id: 'pay-1', ...v }),
      ),
    };
    stock = {
      assertBranchOperable: jest.fn().mockResolvedValue(undefined),
      take: jest.fn().mockResolvedValue(true),
    };
    useCase = new SaleCreateUseCase(repo as any, stock as any);
  });

  const run = (data: any, key?: string) =>
    useCase.execute(BIZ, BRANCH, 'clerk_1', data, key);

  it('prices from the catalog and ignores client-sent money fields', async () => {
    const result = await run({
      items: [{ productId: P1, qty: 2, price: '0.01' }],
      totalAmount: '0.01',
      qty: 999,
    });

    expect(result.sale).toMatchObject({
      businessId: BIZ,
      branchId: BRANCH,
      userId: 'user-uuid',
      receiptNumber: 'S-000042',
      subTotal: '20.00',
      totalAmount: '20.00',
      qty: 2,
    });
    expect(result.items[0]).toMatchObject({ price: '10.00', qty: 2 });
    expect(result.inventoryMovements[0]).toMatchObject({
      branchId: BRANCH,
      qty: -2,
      saleId: 'sale-1',
    });
  });

  it('applies tax after discount and requires the payment to match', async () => {
    repo.loadTaxes.mockResolvedValue([
      {
        id: TAX,
        name: 'VAT',
        isActive: true,
        type: 'percentage',
        rate: '10.00',
      },
    ]);
    repo.loadDiscounts.mockResolvedValue([
      {
        id: DISC,
        name: 'Promo',
        isActive: true,
        type: 'percentage',
        value: '10.00',
        start: new Date(Date.now() - 1000),
        end: new Date(Date.now() + 100000),
      },
    ]);

    // 2 x 10.00 = 20.00, -10% = 18.00, +10% tax = 19.80
    const result = await run({
      items: [{ productId: P1, qty: 2, taxId: TAX, discountId: DISC }],
      payment: { method: PaymentMethodEnum.CASH, amount: '19.80' },
    });

    expect(result.sale).toMatchObject({
      subTotal: '20.00',
      totalDiscount: '2.00',
      totalTax: '1.80',
      totalAmount: '19.80',
    });
    expect(result.payment).toMatchObject({
      amount: '19.80',
      status: 'completed',
    });
  });

  it('rejects a payment that does not match the computed total, before touching stock', async () => {
    await expect(
      run({
        items: [{ productId: P1, qty: 1 }],
        payment: { method: PaymentMethodEnum.CASH, amount: '0.01' },
      }),
    ).rejects.toThrow(/must equal the sale total \(10\.00\)/);
    expect(stock.take).not.toHaveBeenCalled();
    expect(repo.insertSale).not.toHaveBeenCalled();
  });

  it('never takes payment status from the client', async () => {
    const result = await run({
      items: [{ productId: P1, qty: 1 }],
      payment: {
        method: PaymentMethodEnum.CARD,
        amount: '10.00',
        status: 'pending',
      },
    });
    expect(result.payment!.status).toBe('completed');
  });

  it('404s on a product from another business', async () => {
    repo.loadProducts.mockResolvedValue([]);
    await expect(run({ items: [{ productId: P1, qty: 1 }] })).rejects.toThrow(
      NotFoundException,
    );
  });

  it('404s on a tax, discount or customer that is not in this business', async () => {
    await expect(
      run({ items: [{ productId: P1, qty: 1, taxId: TAX }] }),
    ).rejects.toThrow(NotFoundException);
    await expect(
      run({ items: [{ productId: P1, qty: 1, discountId: DISC }] }),
    ).rejects.toThrow(NotFoundException);

    repo.customerExists.mockResolvedValue(false);
    await expect(
      run({ items: [{ productId: P1, qty: 1 }], customerId: CUST }),
    ).rejects.toThrow(NotFoundException);
    expect(repo.insertSale).not.toHaveBeenCalled();
  });

  it('rejects inactive or expired discounts', async () => {
    const base = { id: DISC, name: 'Promo', type: 'fixed', value: '1.00' };
    repo.loadDiscounts.mockResolvedValue([
      { ...base, isActive: false, start: new Date(0), end: new Date(9e12) },
    ]);
    await expect(
      run({ items: [{ productId: P1, qty: 1, discountId: DISC }] }),
    ).rejects.toThrow(/not currently valid/);

    repo.loadDiscounts.mockResolvedValue([
      { ...base, isActive: true, start: new Date(0), end: new Date(1000) },
    ]);
    await expect(
      run({ items: [{ productId: P1, qty: 1, discountId: DISC }] }),
    ).rejects.toThrow(/not currently valid/);
  });

  it('fails the whole sale when stock is short', async () => {
    stock.take.mockResolvedValue(false);
    await expect(run({ items: [{ productId: P1, qty: 500 }] })).rejects.toThrow(
      BadRequestException,
    );
    expect(repo.insertSale).not.toHaveBeenCalled();
    expect(repo.insertPayment).not.toHaveBeenCalled();
  });

  it('takes the business lock before stock, and stock in id order, summed per product', async () => {
    await run({
      items: [
        { productId: P2, qty: 1 },
        { productId: P1, qty: 2 },
        { productId: P2, qty: 3 },
      ],
    });

    expect(repo.nextSaleNumber.mock.invocationCallOrder[0]).toBeLessThan(
      stock.take.mock.invocationCallOrder[0],
    );
    expect(stock.take.mock.calls.map((c) => [c[2], c[3]])).toEqual([
      [P1, 2],
      [P2, 4],
    ]);
  });

  it('takes stock from the request branch and checks it is operable first', async () => {
    await run({ items: [{ productId: P1, qty: 2 }] });

    expect(stock.assertBranchOperable).toHaveBeenCalledWith('tx', BIZ, BRANCH);
    expect(stock.take).toHaveBeenCalledWith('tx', BRANCH, P1, 2);
  });

  it('sells nothing from an unavailable branch', async () => {
    stock.assertBranchOperable.mockRejectedValue(new BadRequestException('x'));
    await expect(run({ items: [{ productId: P1, qty: 1 }] })).rejects.toThrow(
      BadRequestException,
    );
    expect(stock.take).not.toHaveBeenCalled();
    expect(repo.insertSale).not.toHaveBeenCalled();
  });

  it('validates the request shape', async () => {
    await expect(run({ items: [] })).rejects.toThrow(/At least one sale item/);
    await expect(
      run({ items: [{ productId: 'nope', qty: 1 }] }),
    ).rejects.toThrow(/valid UUID/);
    await expect(run({ items: [{ productId: P1, qty: 0 }] })).rejects.toThrow(
      /at least 1/,
    );
    await expect(run({ items: [{ productId: P1, qty: 1.5 }] })).rejects.toThrow(
      /whole number/,
    );
  });

  describe('idempotency', () => {
    it('rejects malformed keys', async () => {
      await expect(
        run({ items: [{ productId: P1, qty: 1 }] }, 'short'),
      ).rejects.toThrow(/Idempotency-Key/);
    });

    it('returns the original sale for a repeated key without writing', async () => {
      repo.findByIdempotencyKey.mockResolvedValue({ id: 'sale-old' });
      repo.loadBundle.mockResolvedValue({
        sale: { id: 'sale-old' },
        items: [],
      });

      const result: any = await run(
        { items: [{ productId: P1, qty: 1 }] },
        'key-12345678',
      );

      expect(result.replayed).toBe(true);
      expect(result.sale.id).toBe('sale-old');
      expect(stock.take).not.toHaveBeenCalled();
      expect(repo.insertSale).not.toHaveBeenCalled();
    });

    it('resolves a race lost on the unique index to the winning sale', async () => {
      repo.insertSale.mockRejectedValueOnce({
        cause: { code: '23505', constraint: 'sales_business_idempotency_uq' },
      });
      repo.findByIdempotencyKey
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce({ id: 'sale-winner' });
      repo.loadBundle.mockResolvedValue({
        sale: { id: 'sale-winner' },
        items: [],
      });

      const result: any = await run(
        { items: [{ productId: P1, qty: 1 }] },
        'key-12345678',
      );

      expect(result.replayed).toBe(true);
      expect(result.sale.id).toBe('sale-winner');
    });

    it('does not swallow other database errors', async () => {
      repo.insertSale.mockRejectedValueOnce({
        cause: { code: '23505', constraint: 'sales_business_receipt_uq' },
      });
      await expect(
        run({ items: [{ productId: P1, qty: 1 }] }, 'key-12345678'),
      ).rejects.toBeDefined();
    });
  });
});
