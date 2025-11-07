import { Test, TestingModule } from '@nestjs/testing';
import { SupplierDeleteUseCase } from '../supplier-delete.usecase';
import { SupplierService } from '../../infrastructure/supplier.service';
import { BusinessService } from '../../../business/infrastructure/business.service';
import { NotFoundException } from '@nestjs/common';

describe('SupplierDeleteUseCase', () => {
  let useCase: SupplierDeleteUseCase;
  let supplierService: jest.Mocked<SupplierService>;
  let businessService: jest.Mocked<BusinessService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SupplierDeleteUseCase,
        {
          provide: SupplierService,
          useValue: {
            deleteSupplier: jest.fn(),
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

    useCase = module.get<SupplierDeleteUseCase>(SupplierDeleteUseCase);
    supplierService = module.get(SupplierService);
    businessService = module.get(BusinessService);
  });

  it('should delete supplier successfully', async () => {
    const supplierId = 'supplier-123';
    const orgId = 'org-123';
    const business = { id: 'business-123' };

    businessService.getBusinessWithUserByOrgId.mockResolvedValue(business as any);
    supplierService.deleteSupplier.mockResolvedValue({} as any);

    await useCase.execute(supplierId, orgId);

    expect(businessService.getBusinessWithUserByOrgId).toHaveBeenCalledWith(orgId);
    expect(supplierService.deleteSupplier).toHaveBeenCalledWith(supplierId, business.id);
  });

  it('should throw NotFoundException when business not found', async () => {
    const supplierId = 'supplier-123';
    const orgId = 'org-123';

    businessService.getBusinessWithUserByOrgId.mockResolvedValue(undefined);

    await expect(useCase.execute(supplierId, orgId)).rejects.toThrow(NotFoundException);
  });
});
