import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { OrderUpdateUsecase } from '../order.update.usecase';
import { OrderService } from '../../infrastructure/order.service';
import { BusinessService } from '../../../business/infrastructure/business.service';

describe('OrderUpdateUsecase', () => {
  let usecase: OrderUpdateUsecase;
  let orderService: jest.Mocked<OrderService>;
  let businessService: jest.Mocked<BusinessService>;

  beforeEach(async () => {
    const mockOrderService = {
      updateOrder: jest.fn(),
    };

    const mockBusinessService = {
      getBusinessWithUserByOrgId: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderUpdateUsecase,
        {
          provide: OrderService,
          useValue: mockOrderService,
        },
        {
          provide: BusinessService,
          useValue: mockBusinessService,
        },
      ],
    }).compile();

    usecase = module.get<OrderUpdateUsecase>(OrderUpdateUsecase);
    orderService = module.get(OrderService);
    businessService = module.get(BusinessService);
  });

  describe('execute', () => {
    const orderId = 'order-123';
    const orgId = 'org-123';
    const orderData = {
      totalAmount: 150,
      expectedDate: new Date(Date.now() + 86400000), // Tomorrow
      status: 'received' as const,
      invoiceId: 'invoice-123',
    };
    const mockBusiness = { id: 'business-123' };
    const mockOrder = { id: orderId, totalAmount: 150 };

    it('should update an order successfully when business exists', async () => {
      businessService.getBusinessWithUserByOrgId.mockResolvedValue(
        mockBusiness as any,
      );
      orderService.updateOrder.mockResolvedValue(mockOrder as any);

      const result = await usecase.execute(orderId, orgId, orderData as any);

      expect(businessService.getBusinessWithUserByOrgId).toHaveBeenCalledWith(
        orgId,
      );
      expect(orderService.updateOrder).toHaveBeenCalled();
      expect(result).toEqual(mockOrder);
    });

    it('should throw NotFoundException when business not found', async () => {
      businessService.getBusinessWithUserByOrgId.mockResolvedValue(null as any);

      await expect(
        usecase.execute(orderId, orgId, orderData as any),
      ).rejects.toThrow(NotFoundException);
      expect(orderService.updateOrder).not.toHaveBeenCalled();
    });
  });
});
