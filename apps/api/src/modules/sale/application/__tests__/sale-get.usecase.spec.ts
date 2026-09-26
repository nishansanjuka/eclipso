import { Test, TestingModule } from '@nestjs/testing';
import { SaleGetUseCase } from '../sale-get.usecase';
import { SaleService } from '../../infrastructure/sale.service';
import { BusinessService } from '../../../business/infrastructure/business.service';
import { NotFoundException } from '@nestjs/common';

const scope = { canAccessBranch: () => true, restrictedBranchIds: null };

describe('SaleGetUseCase', () => {
  let useCase: SaleGetUseCase;
  let saleService: jest.Mocked<SaleService>;
  let businessService: jest.Mocked<BusinessService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SaleGetUseCase,
        {
          provide: SaleService,
          useValue: {
            getSaleById: jest.fn(),
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

    useCase = module.get<SaleGetUseCase>(SaleGetUseCase);
    saleService = module.get(SaleService);
    businessService = module.get(BusinessService);
  });

  it('should get sale successfully', async () => {
    const saleId = 'sale-123';
    const orgId = 'org-123';
    const business = { id: 'business-123' };
    const sale = { id: saleId, businessId: business.id, branchId: 'br-1' };

    businessService.getBusinessWithUserByOrgId.mockResolvedValue(
      business as any,
    );
    saleService.getSaleById.mockResolvedValue(sale as any);

    const result = await useCase.execute(saleId, orgId, scope);

    expect(businessService.getBusinessWithUserByOrgId).toHaveBeenCalledWith(
      orgId,
    );
    expect(saleService.getSaleById).toHaveBeenCalledWith(saleId, business.id);
    expect(result).toEqual(sale);
  });

  it('should throw NotFoundException when business not found', async () => {
    const saleId = 'sale-123';
    const orgId = 'org-123';

    businessService.getBusinessWithUserByOrgId.mockResolvedValue(undefined);

    await expect(useCase.execute(saleId, orgId, scope)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('should throw NotFoundException when sale not found', async () => {
    const saleId = 'sale-123';
    const orgId = 'org-123';
    const business = { id: 'business-123' };

    businessService.getBusinessWithUserByOrgId.mockResolvedValue(
      business as any,
    );
    saleService.getSaleById.mockResolvedValue(null);

    await expect(useCase.execute(saleId, orgId, scope)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('hides a sale that belongs to a branch the caller may not work in', async () => {
    const business = { id: 'business-123' };
    businessService.getBusinessWithUserByOrgId.mockResolvedValue(
      business as any,
    );
    saleService.getSaleById.mockResolvedValue({
      id: 'sale-1',
      branchId: 'br-9',
    } as any);

    await expect(
      useCase.execute('sale-1', 'org-123', {
        canAccessBranch: (id: string) => id === 'br-1',
        restrictedBranchIds: ['br-1'],
      }),
    ).rejects.toThrow(NotFoundException);
  });
});
