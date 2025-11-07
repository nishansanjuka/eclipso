import { Test, TestingModule } from '@nestjs/testing';
import { InvoiceCalculateUsecase } from '../invoice-calculate.usecase';
import { InvoiceService } from '../../infrastructure/invoice.service';
import { OrderService } from '../../../order/infrastructure/order.service';
import { OrderItemService } from '../../../order/infrastructure/order-item.service';
import { TaxService } from '../../../tax/infrastructure/tax.service';
import { DiscountService } from '../../../discount/infrastructure/discount.service';
import { NotFoundException } from '@nestjs/common';

describe('InvoiceCalculateUsecase', () => {
  let useCase: InvoiceCalculateUsecase;
  let invoiceService: jest.Mocked<InvoiceService>;
  let orderService: jest.Mocked<OrderService>;
  let orderItemService: jest.Mocked<OrderItemService>;
  let taxService: jest.Mocked<TaxService>;
  let discountService: jest.Mocked<DiscountService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvoiceCalculateUsecase,
        {
          provide: InvoiceService,
          useValue: {
            updateInvoice: jest.fn(),
            getInvoiceDataById: jest.fn(),
          },
        },
        {
          provide: OrderService,
          useValue: {
            getOrder: jest.fn(),
          },
        },
        {
          provide: OrderItemService,
          useValue: {
            getOrderItemsByOrderId: jest.fn(),
            getTaxRecordsForOrderItem: jest.fn(),
            getDiscountRecordsForOrderItem: jest.fn(),
          },
        },
        {
          provide: TaxService,
          useValue: {
            getTaxById: jest.fn(),
          },
        },
        {
          provide: DiscountService,
          useValue: {
            getDiscountById: jest.fn(),
          },
        },
      ],
    }).compile();

    useCase = module.get<InvoiceCalculateUsecase>(InvoiceCalculateUsecase);
    invoiceService = module.get(InvoiceService);
    orderService = module.get(OrderService);
    orderItemService = module.get(OrderItemService);
    taxService = module.get(TaxService);
    discountService = module.get(DiscountService);
  });

  it('should throw NotFoundException when order not found', async () => {
    const orderId = 'order-123';
    const orgId = 'org-123';

    orderService.getOrder.mockResolvedValue(null as any);

    await expect(useCase.execute(orderId, orgId)).rejects.toThrow(NotFoundException);
  });

  it('should throw NotFoundException when no order items found', async () => {
    const orderId = 'order-123';
    const orgId = 'org-123';
    const order = { id: orderId, invoiceId: 'invoice-123' };

    orderService.getOrder.mockResolvedValue(order as any);
    orderItemService.getOrderItemsByOrderId.mockResolvedValue([]);

    await expect(useCase.execute(orderId, orgId)).rejects.toThrow(NotFoundException);
  });
});
