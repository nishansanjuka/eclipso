import { Test, TestingModule } from '@nestjs/testing';
import { InvoiceGetUsecase } from '../invoice-get.usecase';
import { InvoiceService } from '../../infrastructure/invoice.service';
import { OrderService } from '../../../order/infrastructure/order.service';
import { NotFoundException } from '@nestjs/common';

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
    const order = { id: 'order-123', invoiceId };
    const invoiceData = { id: invoiceId, grandTotal: '100.00' };

    orderService.getOrderByInvoiceId.mockResolvedValue(order as any);
    invoiceService.getInvoiceDataById.mockResolvedValue(invoiceData as any);

    const result = await useCase.execute(invoiceId, orgId);

    expect(orderService.getOrderByInvoiceId).toHaveBeenCalledWith(invoiceId, orgId);
    expect(invoiceService.getInvoiceDataById).toHaveBeenCalledWith(invoiceId);
    expect(result).toEqual(invoiceData);
  });

  it('should throw NotFoundException when order not found', async () => {
    const invoiceId = 'invoice-123';
    const orgId = 'org-123';

    orderService.getOrderByInvoiceId.mockResolvedValue({} as any);

    await expect(useCase.execute(invoiceId, orgId)).rejects.toThrow(NotFoundException);
  });
});
