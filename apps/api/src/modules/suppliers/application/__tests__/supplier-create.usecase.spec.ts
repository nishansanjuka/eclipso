import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { SupplierCreateUseCase } from '../supplier-create.usecase';
import { SupplierService } from '../../infrastructure/supplier.service';
import { BusinessService } from '../../../business/infrastructure/business.service';

describe('SupplierCreateUseCase', () => {
  let usecase: SupplierCreateUseCase;
  let supplierService: jest.Mocked<SupplierService>;
  let businessService: jest.Mocked<BusinessService>;

  beforeEach(async () => {
    const mockSupplierService = {
      createSupplier: jest.fn(),
    };

    const mockBusinessService = {
      getBusinessWithUserByOrgId: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SupplierCreateUseCase,
        {
          provide: SupplierService,
          useValue: mockSupplierService,
        },
        {
          provide: BusinessService,
          useValue: mockBusinessService,
        },
      ],
    }).compile();

    usecase = module.get<SupplierCreateUseCase>(SupplierCreateUseCase);
    supplierService = module.get(SupplierService);
    businessService = module.get(BusinessService);
  });

  describe('execute', () => {
    const orgId = 'org-123';
    const supplierData = {
      name: 'Supplier Inc',
      contact: 'contact@supplier.com',
      description: 'A reliable supplier',
    };
    const mockBusiness = { id: 'business-123' };
    const mockSupplier = { id: 'supplier-123', name: 'Supplier Inc' };

    it('should create a supplier successfully when business exists', async () => {
      businessService.getBusinessWithUserByOrgId.mockResolvedValue(
        mockBusiness as any,
      );
      supplierService.createSupplier.mockResolvedValue(mockSupplier as any);

      const result = await usecase.execute(orgId, supplierData as any);

      expect(businessService.getBusinessWithUserByOrgId).toHaveBeenCalledWith(
        orgId,
      );
      expect(supplierService.createSupplier).toHaveBeenCalled();
      expect(result).toEqual(mockSupplier);
    });

    it('should throw NotFoundException when business not found', async () => {
      businessService.getBusinessWithUserByOrgId.mockResolvedValue(null as any);

      await expect(usecase.execute(orgId, supplierData as any)).rejects.toThrow(
        NotFoundException,
      );
      expect(supplierService.createSupplier).not.toHaveBeenCalled();
    });
  });
});
