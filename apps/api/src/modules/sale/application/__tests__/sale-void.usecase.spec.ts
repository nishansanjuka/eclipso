import { ConflictException, NotFoundException } from '@nestjs/common';
import { SaleVoidUseCase } from '../sale-void.usecase';

describe('SaleVoidUseCase', () => {
  let checkout: Record<string, jest.Mock>;
  let stock: Record<string, jest.Mock>;
  let useCase: SaleVoidUseCase;

  beforeEach(() => {
    checkout = {
      transaction: jest.fn((fn: (tx: unknown) => unknown) => fn('tx')),
      lockSale: jest
        .fn()
        .mockResolvedValue({ id: 's1', status: 'completed', branchId: 'br-1' }),
      countLiveReturns: jest.fn().mockResolvedValue(0),
      loadSaleItems: jest.fn().mockResolvedValue([
        { productId: 'p2', qty: 1 },
        { productId: 'p1', qty: 2 },
        { productId: 'p2', qty: 3 },
      ]),
      insertMovements: jest.fn((_tx, v) => Promise.resolve(v)),
      markPaymentsRefunded: jest.fn(),
      findUserIdByClerkId: jest.fn().mockResolvedValue('user-uuid'),
      markVoided: jest.fn((_tx, id, v) =>
        Promise.resolve({ id, status: 'voided', ...v }),
      ),
    };
    stock = { add: jest.fn().mockResolvedValue(true) };
    useCase = new SaleVoidUseCase(checkout as any, stock as any);
  });

  let scope: { canAccessBranch: jest.Mock; restrictedBranchIds: null };
  beforeEach(() => {
    scope = {
      canAccessBranch: jest.fn().mockReturnValue(true),
      restrictedBranchIds: null,
    };
  });

  const run = (body: any = { reason: 'Rung up twice' }) =>
    useCase.execute('s1', 'biz-1', 'clerk_1', body, scope);

  it('restocks every unit, logs VOID movements, refunds payments and marks the sale', async () => {
    const result: any = await run();

    // Units go back to the branch the sale was made at.
    expect(stock.add.mock.calls.map((c) => [c[1], c[2], c[3]])).toEqual([
      ['br-1', 'p1', 2],
      ['br-1', 'p2', 4],
    ]);
    expect(checkout.insertMovements.mock.calls[0][1]).toEqual(
      expect.arrayContaining([
        {
          branchId: 'br-1',
          productId: 'p1',
          saleId: 's1',
          qty: 2,
          movementType: 'void',
        },
        {
          branchId: 'br-1',
          productId: 'p2',
          saleId: 's1',
          qty: 4,
          movementType: 'void',
        },
      ]),
    );
    expect(checkout.markPaymentsRefunded).toHaveBeenCalledWith('tx', 's1');
    expect(result.sale).toMatchObject({
      status: 'voided',
      voidedBy: 'user-uuid',
      voidReason: 'Rung up twice',
    });
  });

  it('cannot void twice, so stock is never restored twice', async () => {
    checkout.lockSale.mockResolvedValue({
      id: 's1',
      status: 'voided',
      branchId: 'br-1',
    });
    await expect(run()).rejects.toThrow(ConflictException);
    expect(stock.add).not.toHaveBeenCalled();
  });

  it('cannot void a sale that has returns', async () => {
    checkout.countLiveReturns.mockResolvedValue(1);
    await expect(run()).rejects.toThrow(/has returns/);
    expect(stock.add).not.toHaveBeenCalled();
  });

  it('404s for a sale in another business', async () => {
    checkout.lockSale.mockResolvedValue(undefined);
    await expect(run()).rejects.toThrow(NotFoundException);
  });

  it('404s for a sale in a branch the caller is not allowed to work in', async () => {
    scope.canAccessBranch.mockReturnValue(false);
    await expect(run()).rejects.toThrow(NotFoundException);
    expect(stock.add).not.toHaveBeenCalled();
  });

  it('requires a real reason', async () => {
    await expect(run({})).rejects.toThrow(/reason/i);
    await expect(run({ reason: 'x' })).rejects.toThrow(/at least 3/);
    expect(checkout.lockSale).not.toHaveBeenCalled();
  });
});
