import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { OrderCreateUsecase } from '../order.create.usecase';
import { OrderService } from '../../infrastructure/order.service';
import { BusinessService } from '../../../business/infrastructure/business.service';
import { InvoiceService } from '../../../invoice/infrastructure/invoice.service';

describe('OrderCreateUsecase', () => {
  let usecase: OrderCreateUsecase;
  let orderService: jest.Mocked<OrderService>;
  let businessService: jest.Mocked<BusinessService>;
  let invoiceService: jest.Mocked<InvoiceService>;

  beforeEach(async () => {
    const mockOrderService = {
      createOrder: jest.fn(),
    };

    const mockBusinessService = {
      getBusinessWithUserByOrgId: jest.fn(),
    };

    const mockInvoiceService = {
      createInvoice: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderCreateUsecase,
        {
          provide: OrderService,
          useValue: mockOrderService,
        },
        {
          provide: BusinessService,
          useValue: mockBusinessService,
        },
        {
          provide: InvoiceService,
          useValue: mockInvoiceService,
        },
      ],
    }).compile();

    usecase = module.get<OrderCreateUsecase>(OrderCreateUsecase);
    orderService = module.get(OrderService);
    businessService = module.get(BusinessService);
    invoiceService = module.get(InvoiceService);
  });

  describe('execute', () => {
    const orgId = 'org-123';
    const orderData = {
      customerId: 'customer-123',
      totalAmount: 100,
      supplierId: 'supplier-123',
      expectedDate: new Date(Date.now() + 86400000), // Tomorrow
      status: 'draft' as const,
    };
    const mockBusiness = { id: 'business-123' };
    const mockInvoice = { id: 'invoice-123' };
    const mockOrder = { id: 'order-123', customerId: 'customer-123' };

    it('should create an order successfully when business exists', async () => {
      businessService.getBusinessWithUserByOrgId.mockResolvedValue(
        mockBusiness as any,
      );
      invoiceService.createInvoice.mockResolvedValue(mockInvoice as any);
      orderService.createOrder.mockResolvedValue(mockOrder as any);

      const result = await usecase.execute(orgId, orderData as any);

      expect(businessService.getBusinessWithUserByOrgId).toHaveBeenCalledWith(
        orgId,
      );
      expect(invoiceService.createInvoice).toHaveBeenCalled();
      expect(orderService.createOrder).toHaveBeenCalled();
      expect(result).toEqual(mockOrder);
    });

    it('should throw NotFoundException when business not found', async () => {
      businessService.getBusinessWithUserByOrgId.mockResolvedValue(null as any);

      await expect(usecase.execute(orgId, orderData as any)).rejects.toThrow(
        NotFoundException,
      );
      expect(invoiceService.createInvoice).not.toHaveBeenCalled();
      expect(orderService.createOrder).not.toHaveBeenCalled();
    });
  });
});
