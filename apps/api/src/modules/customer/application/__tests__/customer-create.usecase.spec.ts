import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { CustomerCreateUseCase } from '../customer-create.usecase';
import { CustomerService } from '../../infrastructure/customer.service';
import { BusinessService } from '../../../business/infrastructure/business.service';

describe('CustomerCreateUseCase', () => {
  let usecase: CustomerCreateUseCase;
  let customerService: jest.Mocked<CustomerService>;
  let businessService: jest.Mocked<BusinessService>;

  beforeEach(async () => {
    const mockCustomerService = {
      createCustomer: jest.fn(),
    };

    const mockBusinessService = {
      getBusinessWithUserByOrgId: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomerCreateUseCase,
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

    usecase = module.get<CustomerCreateUseCase>(CustomerCreateUseCase);
    customerService = module.get(CustomerService);
    businessService = module.get(BusinessService);
  });

  describe('execute', () => {
    const orgId = 'org-123';
    const customerData = {
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+1234567890',
    };
    const mockBusiness = { id: 'business-123' };
    const mockCustomer = { id: 'customer-123', name: 'John Doe' };

    it('should create a customer successfully when business exists', async () => {
      businessService.getBusinessWithUserByOrgId.mockResolvedValue(
        mockBusiness as any,
      );
      customerService.createCustomer.mockResolvedValue(mockCustomer as any);

      const result = await usecase.execute(orgId, customerData as any);

      expect(businessService.getBusinessWithUserByOrgId).toHaveBeenCalledWith(
        orgId,
      );
      expect(customerService.createCustomer).toHaveBeenCalled();
      expect(result).toEqual(mockCustomer);
    });

    it('should throw NotFoundException when business not found', async () => {
      businessService.getBusinessWithUserByOrgId.mockResolvedValue(null as any);

      await expect(usecase.execute(orgId, customerData as any)).rejects.toThrow(
        NotFoundException,
      );
      expect(customerService.createCustomer).not.toHaveBeenCalled();
    });
  });
});
