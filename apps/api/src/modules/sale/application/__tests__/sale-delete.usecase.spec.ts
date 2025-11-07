import { Test, TestingModule } from '@nestjs/testing';
import { SaleDeleteUseCase } from '../sale-delete.usecase';
import { SaleService } from '../../infrastructure/sale.service';
import { BusinessService } from '../../../business/infrastructure/business.service';
import { NotFoundException } from '@nestjs/common';

describe('SaleDeleteUseCase', () => {
  let useCase: SaleDeleteUseCase;
  let saleService: jest.Mocked<SaleService>;
  let businessService: jest.Mocked<BusinessService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SaleDeleteUseCase,
        {
          provide: SaleService,
          useValue: {
            deleteSale: jest.fn(),
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

    useCase = module.get<SaleDeleteUseCase>(SaleDeleteUseCase);
    saleService = module.get(SaleService);
    businessService = module.get(BusinessService);
  });

  it('should delete sale successfully', async () => {
    const saleId = 'sale-123';
    const orgId = 'org-123';
    const business = { id: 'business-123' };

    businessService.getBusinessWithUserByOrgId.mockResolvedValue(business as any);
    saleService.deleteSale.mockResolvedValue({} as any);

    await useCase.execute(saleId, orgId);

    expect(businessService.getBusinessWithUserByOrgId).toHaveBeenCalledWith(orgId);
    expect(saleService.deleteSale).toHaveBeenCalledWith(saleId, business.id);
  });

  it('should throw NotFoundException when business not found', async () => {
    const saleId = 'sale-123';
    const orgId = 'org-123';

    businessService.getBusinessWithUserByOrgId.mockResolvedValue(undefined);

    await expect(useCase.execute(saleId, orgId)).rejects.toThrow(NotFoundException);
  });
});
