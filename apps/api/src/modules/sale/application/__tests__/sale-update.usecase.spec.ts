import { NotFoundException } from '@nestjs/common';
import { SaleUpdateUseCase } from '../sale-update.usecase';

const CUSTOMER = '3f1c1b1e-7d55-4b52-9d6a-0d3f6c2f6a11';

describe('SaleUpdateUseCase', () => {
  let checkout: Record<string, jest.Mock>;
  let scope: { canAccessBranch: jest.Mock; restrictedBranchIds: null };
  let useCase: SaleUpdateUseCase;

  beforeEach(() => {
    checkout = {
      transaction: jest.fn((fn: (tx: unknown) => unknown) => fn('tx')),
      lockSale: jest
        .fn()
        .mockResolvedValue({ id: 's1', status: 'completed', branchId: 'br-1' }),
      customerExists: jest.fn().mockResolvedValue(true),
      setSaleCustomer: jest.fn((_tx, id, customerId) =>
        Promise.resolve({ id, customerId }),
      ),
    };
    scope = {
      canAccessBranch: jest.fn().mockReturnValue(true),
      restrictedBranchIds: null,
    };
    useCase = new SaleUpdateUseCase(checkout as any);
  });

  const run = (body: any) => useCase.execute('s1', 'biz-1', body, scope);

  it('updates the customer, scoped by business', async () => {
    const result = await run({ customerId: CUSTOMER });

    expect(checkout.lockSale).toHaveBeenCalledWith('tx', 'biz-1', 's1');
    expect(checkout.customerExists).toHaveBeenCalledWith(
      'tx',
      'biz-1',
      CUSTOMER,
    );
    expect(checkout.setSaleCustomer).toHaveBeenCalledWith('tx', 's1', CUSTOMER);
    expect(result).toEqual({ id: 's1', customerId: CUSTOMER });
  });

  it('cannot attach a customer from another business', async () => {
    checkout.customerExists.mockResolvedValue(false);

    await expect(run({ customerId: CUSTOMER })).rejects.toThrow(
      NotFoundException,
    );
    expect(checkout.setSaleCustomer).not.toHaveBeenCalled();
  });

  it('ignores money fields sent by the client and can detach the customer', async () => {
    await run({ customerId: null, totalAmount: '0.01' });

    expect(checkout.setSaleCustomer).toHaveBeenCalledWith('tx', 's1', null);
  });

  it('changes nothing when no customer is given', async () => {
    const result = await run({});

    expect(checkout.setSaleCustomer).not.toHaveBeenCalled();
    expect(result).toMatchObject({ id: 's1' });
  });

  it('404s when the sale is not in this business', async () => {
    checkout.lockSale.mockResolvedValue(undefined);

    await expect(run({ customerId: null })).rejects.toThrow(NotFoundException);
  });

  it('404s for a voided sale', async () => {
    checkout.lockSale.mockResolvedValue({
      id: 's1',
      status: 'voided',
      branchId: 'br-1',
    });

    await expect(run({ customerId: null })).rejects.toThrow(NotFoundException);
  });

  it('404s for a sale in a branch the caller may not work in', async () => {
    scope.canAccessBranch.mockReturnValue(false);

    await expect(run({ customerId: null })).rejects.toThrow(NotFoundException);
    expect(checkout.setSaleCustomer).not.toHaveBeenCalled();
  });
});
