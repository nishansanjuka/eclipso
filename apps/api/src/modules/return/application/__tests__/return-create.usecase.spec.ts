import { ConflictException, NotFoundException } from '@nestjs/common';
import { ReturnCreateUseCase } from '../return-create.usecase';
import {
  RefundMethodEnum,
  ReturnReasonEnum,
} from '../../infrastructure/enums/return.enum';

const BIZ = 'business-1';
const SALE = '11111111-1111-4111-8111-111111111111';
const ITEM_A = '22222222-2222-4222-8222-222222222222';
const ITEM_B = '33333333-3333-4333-8333-333333333333';

// A: 3 x 10.00, -3.00 discount, +2.16 tax = 29.16 paid. B: 1 x 5.00.
const lines = [
  {
    id: ITEM_A,
    productId: 'p-b',
    qty: 3,
    price: '10.00',
    discountAmount: '3.00',
    taxAmount: '2.16',
  },
  {
    id: ITEM_B,
    productId: 'p-a',
    qty: 1,
    price: '5.00',
    discountAmount: '0.00',
    taxAmount: '0.00',
  },
];

describe('ReturnCreateUseCase', () => {
  let sales: Record<string, jest.Mock>;
  let returnsRepo: Record<string, jest.Mock>;
  let stock: Record<string, jest.Mock>;
  let scope: { canAccessBranch: jest.Mock; restrictedBranchIds: null };
  let useCase: ReturnCreateUseCase;

  beforeEach(() => {
    sales = {
      transaction: jest.fn((fn: (tx: unknown) => unknown) => fn('tx')),
      lockSale: jest
        .fn()
        .mockResolvedValue({ id: SALE, status: 'completed', branchId: 'br-1' }),
      loadSaleItems: jest.fn().mockResolvedValue(lines),
      findUserIdByClerkId: jest.fn().mockResolvedValue('user-uuid'),
      insertMovements: jest.fn((_tx, v) => Promise.resolve(v)),
    };
    returnsRepo = {
      returnedQtyBySaleItem: jest.fn().mockResolvedValue(new Map()),
      insertReturn: jest.fn((_tx, v) => Promise.resolve({ id: 'ret-1', ...v })),
      insertItems: jest.fn((_tx, v) => Promise.resolve(v)),
      insertRefund: jest.fn((_tx, v) => Promise.resolve({ id: 'ref-1', ...v })),
    };
    stock = { add: jest.fn().mockResolvedValue(true) };
    scope = {
      canAccessBranch: jest.fn().mockReturnValue(true),
      restrictedBranchIds: null,
    };
    useCase = new ReturnCreateUseCase(
      sales as any,
      returnsRepo as any,
      stock as any,
    );
  });

  const run = (data: any) => useCase.execute(BIZ, 'clerk_1', data, scope);
  const base = {
    saleId: SALE,
    reason: ReturnReasonEnum.DEFECTIVE,
    items: [{ saleItemId: ITEM_A, qtyReturned: 1 }],
  };

  it('computes qty, status and refund from the sale, ignoring client values', async () => {
    const result: any = await run({
      ...base,
      qty: 99,
      status: 'pending',
      refund: { method: RefundMethodEnum.CASH, amount: '9999.00' },
    });

    expect(result.return).toMatchObject({
      saleId: SALE,
      userId: 'user-uuid',
      qty: 1,
      status: 'completed',
    });
    expect(result.refund.amount).toBe('9.72'); // 29.16 / 3
    expect(result.refundAmount).toBe('9.72');
  });

  it('restocks and writes RETURN movements in product-id order', async () => {
    await run({
      ...base,
      items: [
        { saleItemId: ITEM_A, qtyReturned: 2 },
        { saleItemId: ITEM_B, qtyReturned: 1 },
      ],
    });

    expect(stock.add.mock.calls.map((c) => [c[2], c[3]])).toEqual([
      ['p-a', 1],
      ['p-b', 2],
    ]);
    expect(sales.insertMovements.mock.calls[0][1]).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          productId: 'p-b',
          qty: 2,
          movementType: 'return',
        }),
      ]),
    );
  });

  it('refunds exactly what was paid across several partial returns', async () => {
    returnsRepo.returnedQtyBySaleItem.mockResolvedValue(new Map([[ITEM_A, 1]]));
    const second: any = await run({
      ...base,
      items: [{ saleItemId: ITEM_A, qtyReturned: 2 }],
      refund: { method: RefundMethodEnum.CARD },
    });
    // first return refunded 9.72; the remaining two make up the rest of 29.16
    expect(second.refundAmount).toBe('19.44');
  });

  it('refuses to return more than was sold minus what was already returned', async () => {
    returnsRepo.returnedQtyBySaleItem.mockResolvedValue(new Map([[ITEM_A, 2]]));
    await expect(
      run({ ...base, items: [{ saleItemId: ITEM_A, qtyReturned: 2 }] }),
    ).rejects.toThrow(/3 sold, 2 already returned, 1 left/);
    expect(returnsRepo.insertReturn).not.toHaveBeenCalled();
    expect(stock.add).not.toHaveBeenCalled();
  });

  it('404s for a sale from another business or an item not on the sale', async () => {
    sales.lockSale.mockResolvedValue(undefined);
    await expect(run(base)).rejects.toThrow(NotFoundException);

    sales.lockSale.mockResolvedValue({
      id: SALE,
      status: 'completed',
      branchId: 'br-1',
    });
    await expect(
      run({
        ...base,
        items: [
          {
            saleItemId: '44444444-4444-4444-8444-444444444444',
            qtyReturned: 1,
          },
        ],
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('refuses returns on a voided sale', async () => {
    sales.lockSale.mockResolvedValue({
      id: SALE,
      status: 'voided',
      branchId: 'br-1',
    });
    await expect(run(base)).rejects.toThrow(ConflictException);
  });

  it('locks the sale before reading the returned quantities', async () => {
    await run(base);
    expect(sales.lockSale.mock.invocationCallOrder[0]).toBeLessThan(
      returnsRepo.returnedQtyBySaleItem.mock.invocationCallOrder[0],
    );
  });

  it('validates the request', async () => {
    await expect(run({ ...base, items: [] })).rejects.toThrow(/At least one/);
    await expect(
      run({ ...base, items: [{ saleItemId: ITEM_A, qtyReturned: 0 }] }),
    ).rejects.toThrow(/at least 1/);
    await expect(
      run({
        ...base,
        items: [
          { saleItemId: ITEM_A, qtyReturned: 1 },
          { saleItemId: ITEM_A, qtyReturned: 1 },
        ],
      }),
    ).rejects.toThrow(/only once/);
    await expect(run({ ...base, saleId: 'x' })).rejects.toThrow(/valid UUID/);
  });

  it('a stock restore failure aborts the whole return', async () => {
    stock.add.mockResolvedValue(false);
    await expect(run(base)).rejects.toThrow(NotFoundException);
  });

  it("restocks the branch the sale was made at, not the caller's", async () => {
    await run(base);
    expect(stock.add.mock.calls[0].slice(1, 3)).toEqual(['br-1', 'p-b']);
    expect(sales.insertMovements.mock.calls[0][1][0]).toMatchObject({
      branchId: 'br-1',
    });
  });

  it('404s for a sale in a branch the caller may not work in', async () => {
    scope.canAccessBranch.mockReturnValue(false);
    await expect(run(base)).rejects.toThrow(NotFoundException);
    expect(returnsRepo.insertReturn).not.toHaveBeenCalled();
    expect(stock.add).not.toHaveBeenCalled();
  });
});
