import { NotFoundException } from '@nestjs/common';
import { SaleUpdateUseCase } from '../sale-update.usecase';

const CUSTOMER = '3f1c1b1e-7d55-4b52-9d6a-0d3f6c2f6a11';

describe('SaleUpdateUseCase', () => {
  let saleService: { updateSale: jest.Mock };
  let checkout: { transaction: jest.Mock; customerExists: jest.Mock };
  let useCase: SaleUpdateUseCase;

  beforeEach(() => {
    saleService = { updateSale: jest.fn() };
    checkout = {
      transaction: jest.fn((fn: (tx: unknown) => unknown) => fn('tx')),
      customerExists: jest.fn().mockResolvedValue(true),
    };
    useCase = new SaleUpdateUseCase(saleService as any, checkout as any);
  });

  it('updates the customer, scoped by business', async () => {
    saleService.updateSale.mockResolvedValue([{ id: 's1' }]);

    const result = await useCase.execute('s1', 'biz-1', {
      customerId: CUSTOMER,
    });

    expect(checkout.customerExists).toHaveBeenCalledWith(
      'tx',
      'biz-1',
      CUSTOMER,
    );
    expect(saleService.updateSale).toHaveBeenCalledWith('s1', 'biz-1', {
      customerId: CUSTOMER,
    });
    expect(result).toEqual({ id: 's1' });
  });

  it('cannot attach a customer from another business', async () => {
    checkout.customerExists.mockResolvedValue(false);

    await expect(
      useCase.execute('s1', 'biz-1', { customerId: CUSTOMER }),
    ).rejects.toThrow(NotFoundException);
    expect(saleService.updateSale).not.toHaveBeenCalled();
  });

  it('ignores money fields sent by the client', async () => {
    saleService.updateSale.mockResolvedValue([{ id: 's1' }]);

    await useCase.execute('s1', 'biz-1', {
      customerId: null,
      totalAmount: '0.01',
    } as any);

    expect(saleService.updateSale).toHaveBeenCalledWith('s1', 'biz-1', {
      customerId: null,
    });
  });

  it('404s when the sale is not in this business', async () => {
    saleService.updateSale.mockResolvedValue([]);

    await expect(
      useCase.execute('s1', 'biz-1', { customerId: null }),
    ).rejects.toThrow(NotFoundException);
  });
});
