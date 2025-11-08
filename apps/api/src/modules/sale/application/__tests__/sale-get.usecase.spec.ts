import { Test, TestingModule } from '@nestjs/testing';
import { SaleGetUseCase } from '../sale-get.usecase';
import { SaleService } from '../../infrastructure/sale.service';
import { BusinessService } from '../../../business/infrastructure/business.service';
import { NotFoundException } from '@nestjs/common';

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
    const sale = { id: saleId, businessId: business.id };

    businessService.getBusinessWithUserByOrgId.mockResolvedValue(business as any);
    saleService.getSaleById.mockResolvedValue(sale as any);

    const result = await useCase.execute(saleId, orgId);

    expect(businessService.getBusinessWithUserByOrgId).toHaveBeenCalledWith(orgId);
    expect(saleService.getSaleById).toHaveBeenCalledWith(saleId, business.id);
    expect(result).toEqual(sale);
  });

  it('should throw NotFoundException when business not found', async () => {
    const saleId = 'sale-123';
    const orgId = 'org-123';

    businessService.getBusinessWithUserByOrgId.mockResolvedValue(undefined);

    await expect(useCase.execute(saleId, orgId)).rejects.toThrow(NotFoundException);
  });

  it('should throw NotFoundException when sale not found', async () => {
    const saleId = 'sale-123';
    const orgId = 'org-123';
    const business = { id: 'business-123' };

    businessService.getBusinessWithUserByOrgId.mockResolvedValue(business as any);
    saleService.getSaleById.mockResolvedValue(null);

    await expect(useCase.execute(saleId, orgId)).rejects.toThrow(NotFoundException);
  });
});
