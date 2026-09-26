import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AdjustmentCreateUsecase } from '../adjustment.create.usecase';

const BIZ = '11111111-1111-4111-8111-111111111111';
const BRANCH = '22222222-2222-4222-8222-222222222222';
const PRODUCT = '33333333-3333-4333-8333-333333333333';

describe('AdjustmentCreateUsecase', () => {
  let adjustments: Record<string, jest.Mock>;
  let checkout: Record<string, jest.Mock>;
  let stock: Record<string, jest.Mock>;
  let usecase: AdjustmentCreateUsecase;

  beforeEach(() => {
    adjustments = {
      insert: jest.fn((_tx, v) => Promise.resolve({ id: 'adj-1', ...v })),
    };
    checkout = {
      transaction: jest.fn((fn: (tx: unknown) => unknown) => fn('tx')),
      loadProducts: jest
        .fn()
        .mockResolvedValue([{ id: PRODUCT, name: 'Widget' }]),
      insertMovements: jest.fn((_tx, v) => Promise.resolve(v)),
    };
    stock = {
      assertBranchOperable: jest.fn().mockResolvedValue(undefined),
      add: jest.fn().mockResolvedValue(true),
      take: jest.fn().mockResolvedValue(true),
    };
    usecase = new AdjustmentCreateUsecase(
      adjustments as any,
      checkout as any,
      stock as any,
    );
  });

  const run = (qty: number, reason = 'Stock count correction') =>
    usecase.execute(PRODUCT, qty, { reason }, BIZ, BRANCH, 'clerk_1');

  it('adds stock at the branch and writes an ADJUSTMENT movement in one transaction', async () => {
    const result = await run(5);

    expect(stock.assertBranchOperable).toHaveBeenCalledWith('tx', BIZ, BRANCH);
    expect(stock.add).toHaveBeenCalledWith('tx', BRANCH, PRODUCT, 5);
    expect(stock.take).not.toHaveBeenCalled();
    expect(adjustments.insert).toHaveBeenCalledWith('tx', {
      businessId: BIZ,
      branchId: BRANCH,
      userId: 'clerk_1',
      reason: 'Stock count correction',
    });
    expect(checkout.insertMovements).toHaveBeenCalledWith('tx', [
      {
        branchId: BRANCH,
        productId: PRODUCT,
        adjustmentId: 'adj-1',
        qty: 5,
        movementType: 'adjustment',
      },
    ]);
    expect(result).toMatchObject({ id: 'adj-1', branchId: BRANCH });
  });

  it('removes stock atomically and refuses to go below zero', async () => {
    await run(-3);
    expect(stock.take).toHaveBeenCalledWith('tx', BRANCH, PRODUCT, 3);

    stock.take.mockResolvedValue(false);
    await expect(run(-999)).rejects.toThrow(/does not hold that many/);
  });

  it('records no movement when the stock change fails', async () => {
    stock.take.mockResolvedValue(false);
    checkout.insertMovements.mockClear();

    await expect(run(-1)).rejects.toThrow(BadRequestException);
    expect(checkout.insertMovements).not.toHaveBeenCalled();
  });

  it('rejects zero, fractional and absurd quantities before touching anything', async () => {
    for (const qty of [0, 1.5, Number.NaN, 5_000_000]) {
      await expect(run(qty)).rejects.toThrow(BadRequestException);
    }
    expect(checkout.transaction).not.toHaveBeenCalled();
  });

  it('404s for a product outside the business, without writing', async () => {
    checkout.loadProducts.mockResolvedValue([]);

    await expect(run(1)).rejects.toThrow(NotFoundException);
    expect(adjustments.insert).not.toHaveBeenCalled();
  });

  it('stops when the branch is not available', async () => {
    stock.assertBranchOperable.mockRejectedValue(new BadRequestException('x'));

    await expect(run(1)).rejects.toThrow(BadRequestException);
    expect(adjustments.insert).not.toHaveBeenCalled();
  });

  it('requires a reason', async () => {
    await expect(run(1, 'x')).rejects.toThrow(/at least 3/);
  });
});
