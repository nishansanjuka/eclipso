import { Test, TestingModule } from '@nestjs/testing';
import { InvoiceGetUsecase } from '../invoice-get.usecase';
import { InvoiceService } from '../../infrastructure/invoice.service';
import { OrderService } from '../../../order/infrastructure/order.service';
import { NotFoundException } from '@nestjs/common';

const scope = { canAccessBranch: () => true, restrictedBranchIds: null };

describe('InvoiceGetUsecase', () => {
  let useCase: InvoiceGetUsecase;
  let invoiceService: jest.Mocked<InvoiceService>;
  let orderService: jest.Mocked<OrderService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvoiceGetUsecase,
        {
          provide: InvoiceService,
          useValue: {
            getInvoiceDataById: jest.fn(),
          },
        },
        {
          provide: OrderService,
          useValue: {
            getOrderByInvoiceId: jest.fn(),
          },
        },
      ],
    }).compile();

    useCase = module.get<InvoiceGetUsecase>(InvoiceGetUsecase);
    invoiceService = module.get(InvoiceService);
    orderService = module.get(OrderService);
  });

  it('should get invoice successfully', async () => {
    const invoiceId = 'invoice-123';
    const orgId = 'org-123';
    const order = { id: 'order-123', invoiceId, branchId: 'br-1' };
    const invoiceData = { id: invoiceId, grandTotal: '100.00' };

    orderService.getOrderByInvoiceId.mockResolvedValue(order as any);
    invoiceService.getInvoiceDataById.mockResolvedValue(invoiceData as any);

    const result = await useCase.execute(invoiceId, orgId, scope);

    expect(orderService.getOrderByInvoiceId).toHaveBeenCalledWith(
      invoiceId,
      orgId,
    );
    expect(invoiceService.getInvoiceDataById).toHaveBeenCalledWith(invoiceId);
    expect(result).toEqual(invoiceData);
  });

  it('should throw NotFoundException when order not found', async () => {
    const invoiceId = 'invoice-123';
    const orgId = 'org-123';

    orderService.getOrderByInvoiceId.mockResolvedValue(undefined as any);

    await expect(useCase.execute(invoiceId, orgId, scope)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('hides an invoice whose order belongs to a branch the caller may not work in', async () => {
    orderService.getOrderByInvoiceId.mockResolvedValue({
      id: 'order-1',
      invoiceId: 'invoice-1',
      branchId: 'br-9',
    } as any);

    await expect(
      useCase.execute('invoice-1', 'org-1', {
        canAccessBranch: (id: string) => id === 'br-1',
        restrictedBranchIds: ['br-1'],
      }),
    ).rejects.toThrow(NotFoundException);
  });
});
