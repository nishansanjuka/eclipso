import { Test, TestingModule } from '@nestjs/testing';
import { SupplierUpdateUseCase } from '../supplier-update.usecase';
import { SupplierService } from '../../infrastructure/supplier.service';
import { BusinessService } from '../../../business/infrastructure/business.service';
import { NotFoundException } from '@nestjs/common';

describe('SupplierUpdateUseCase', () => {
  let useCase: SupplierUpdateUseCase;
  let supplierService: jest.Mocked<SupplierService>;
  let businessService: jest.Mocked<BusinessService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SupplierUpdateUseCase,
        {
          provide: SupplierService,
          useValue: {
            updateSupplier: jest.fn(),
          },
        },
        {
          provide: BusinessService,
          useValue: {
            getBusinessWithUserByOrgId: jest.fn(),
          },
        },
      ],
    }).compile();

    useCase = module.get<SupplierUpdateUseCase>(SupplierUpdateUseCase);
    supplierService = module.get(SupplierService);
    businessService = module.get(BusinessService);
  });

  it('should update supplier successfully', async () => {
    const supplierId = 'supplier-123';
    const orgId = 'org-123';
    const supplierData = { name: 'Updated Supplier', contact: '123-456', description: 'Updated supplier description' };
    const business = { id: 'business-123' };
    const updatedSupplier = { id: supplierId, ...supplierData, businessId: business.id };

    businessService.getBusinessWithUserByOrgId.mockResolvedValue(business as any);
    supplierService.updateSupplier.mockResolvedValue(updatedSupplier as any);

    const result = await useCase.execute(supplierId, orgId, supplierData);

    expect(businessService.getBusinessWithUserByOrgId).toHaveBeenCalledWith(orgId);
    expect(supplierService.updateSupplier).toHaveBeenCalled();
    expect(result).toEqual(updatedSupplier);
  });

  it('should throw NotFoundException when business not found', async () => {
    const supplierId = 'supplier-123';
    const orgId = 'org-123';
    const supplierData = { name: 'Updated Supplier', contact: '123-456', description: 'Updated supplier description' };

    businessService.getBusinessWithUserByOrgId.mockResolvedValue(undefined);

    await expect(useCase.execute(supplierId, orgId, supplierData)).rejects.toThrow(NotFoundException);
  });
});
