import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { OrderDeleteUsecase } from '../order.delete.usecase';
import { OrderService } from '../../infrastructure/order.service';
import { BusinessService } from '../../../business/infrastructure/business.service';
import { InvoiceService } from '../../../invoice/infrastructure/invoice.service';

describe('OrderDeleteUsecase', () => {
  let usecase: OrderDeleteUsecase;
  let orderService: jest.Mocked<OrderService>;
  let businessService: jest.Mocked<BusinessService>;
  let invoiceService: jest.Mocked<InvoiceService>;

  beforeEach(async () => {
    const mockOrderService = {
      getOrder: jest.fn(),
      deleteOrder: jest.fn(),
    };

    const mockBusinessService = {
      getBusinessWithUserByOrgId: jest.fn(),
    };

    const mockInvoiceService = {
      deleteInvoice: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderDeleteUsecase,
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

    usecase = module.get<OrderDeleteUsecase>(OrderDeleteUsecase);
    orderService = module.get(OrderService);
    businessService = module.get(BusinessService);
    invoiceService = module.get(InvoiceService);
  });

  describe('execute', () => {
    const orderId = 'order-123';
    const orgId = 'org-123';
    const mockBusiness = { id: 'business-123' };
    const mockOrder = { id: orderId, invoiceId: 'invoice-123' };

    it('should delete an order successfully when business and order exist', async () => {
      businessService.getBusinessWithUserByOrgId.mockResolvedValue(
        mockBusiness as any,
      );
      orderService.getOrder.mockResolvedValue(mockOrder as any);
      invoiceService.deleteInvoice.mockResolvedValue(undefined as any);
      orderService.deleteOrder.mockResolvedValue(undefined as any);

      await usecase.execute(orderId, orgId);

      expect(businessService.getBusinessWithUserByOrgId).toHaveBeenCalledWith(
        orgId,
      );
      expect(orderService.getOrder).toHaveBeenCalledWith(
        orderId,
        mockBusiness.id,
      );
      expect(invoiceService.deleteInvoice).toHaveBeenCalledWith(
        mockOrder.invoiceId,
      );
      expect(orderService.deleteOrder).toHaveBeenCalledWith(
        orderId,
        mockBusiness.id,
      );
    });

    it('should throw NotFoundException when business not found', async () => {
      businessService.getBusinessWithUserByOrgId.mockResolvedValue(null as any);

      await expect(usecase.execute(orderId, orgId)).rejects.toThrow(
        NotFoundException,
      );
      expect(orderService.getOrder).not.toHaveBeenCalled();
      expect(orderService.deleteOrder).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when order not found', async () => {
      businessService.getBusinessWithUserByOrgId.mockResolvedValue(
        mockBusiness as any,
      );
      orderService.getOrder.mockResolvedValue(null as any);

      await expect(usecase.execute(orderId, orgId)).rejects.toThrow(
        NotFoundException,
      );
      expect(invoiceService.deleteInvoice).not.toHaveBeenCalled();
      expect(orderService.deleteOrder).not.toHaveBeenCalled();
    });
  });
});
