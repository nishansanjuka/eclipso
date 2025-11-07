import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { CustomerDeleteUseCase } from '../customer-delete.usecase';
import { CustomerService } from '../../infrastructure/customer.service';
import { BusinessService } from '../../../business/infrastructure/business.service';

describe('CustomerDeleteUseCase', () => {
  let usecase: CustomerDeleteUseCase;
  let customerService: jest.Mocked<CustomerService>;
  let businessService: jest.Mocked<BusinessService>;

  beforeEach(async () => {
    const mockCustomerService = {
      deleteCustomer: jest.fn(),
    };

    const mockBusinessService = {
      getBusinessWithUserByOrgId: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomerDeleteUseCase,
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

    usecase = module.get<CustomerDeleteUseCase>(CustomerDeleteUseCase);
    customerService = module.get(CustomerService);
    businessService = module.get(BusinessService);
  });

  describe('execute', () => {
    const customerId = 'customer-123';
    const orgId = 'org-123';
    const mockBusiness = { id: 'business-123' };

    it('should delete a customer successfully when business exists', async () => {
      businessService.getBusinessWithUserByOrgId.mockResolvedValue(
        mockBusiness as any,
      );
      customerService.deleteCustomer.mockResolvedValue(undefined as any);

      await usecase.execute(customerId, orgId);

      expect(businessService.getBusinessWithUserByOrgId).toHaveBeenCalledWith(
        orgId,
      );
      expect(customerService.deleteCustomer).toHaveBeenCalled();
    });

    it('should throw NotFoundException when business not found', async () => {
      businessService.getBusinessWithUserByOrgId.mockResolvedValue(null as any);

      await expect(usecase.execute(customerId, orgId)).rejects.toThrow(
        NotFoundException,
      );
      expect(customerService.deleteCustomer).not.toHaveBeenCalled();
    });
  });
});
