import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { CustomerUpdateUseCase } from '../customer-update.usecase';
import { CustomerService } from '../../infrastructure/customer.service';
import { BusinessService } from '../../../business/infrastructure/business.service';

describe('CustomerUpdateUseCase', () => {
  let usecase: CustomerUpdateUseCase;
  let customerService: jest.Mocked<CustomerService>;
  let businessService: jest.Mocked<BusinessService>;

  beforeEach(async () => {
    const mockCustomerService = {
      updateCustomer: jest.fn(),
    };

    const mockBusinessService = {
      getBusinessWithUserByOrgId: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomerUpdateUseCase,
        {
          provide: CustomerService,
          useValue: mockCustomerService,
        },
        {
          provide: BusinessService,
          useValue: mockBusinessService,
        },
      ],
    }).compile();

    usecase = module.get<CustomerUpdateUseCase>(CustomerUpdateUseCase);
    customerService = module.get(CustomerService);
    businessService = module.get(BusinessService);
  });

  describe('execute', () => {
    const customerId = 'customer-123';
    const orgId = 'org-123';
    const customerData = { name: 'Jane Doe', email: 'jane@example.com' };
    const mockBusiness = { id: 'business-123' };
    const mockCustomer = { id: customerId, name: 'Jane Doe' };

    it('should update a customer successfully when business exists', async () => {
      businessService.getBusinessWithUserByOrgId.mockResolvedValue(
        mockBusiness as any,
      );
      customerService.updateCustomer.mockResolvedValue(mockCustomer as any);

      const result = await usecase.execute(
        customerId,
        orgId,
        customerData as any,
      );

      expect(businessService.getBusinessWithUserByOrgId).toHaveBeenCalledWith(
        orgId,
      );
      expect(customerService.updateCustomer).toHaveBeenCalled();
      expect(result).toEqual(mockCustomer);
    });

    it('should throw NotFoundException when business not found', async () => {
      businessService.getBusinessWithUserByOrgId.mockResolvedValue(null as any);

      await expect(
        usecase.execute(customerId, orgId, customerData as any),
      ).rejects.toThrow(NotFoundException);
      expect(customerService.updateCustomer).not.toHaveBeenCalled();
    });
  });
});
