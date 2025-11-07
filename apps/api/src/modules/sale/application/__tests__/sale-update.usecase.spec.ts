import { Test, TestingModule } from '@nestjs/testing';
import { SaleUpdateUseCase } from '../sale-update.usecase';
import { SaleService } from '../../infrastructure/sale.service';
import { BusinessService } from '../../../business/infrastructure/business.service';
import { NotFoundException } from '@nestjs/common';

describe('SaleUpdateUseCase', () => {
  let useCase: SaleUpdateUseCase;
  let saleService: jest.Mocked<SaleService>;
  let businessService: jest.Mocked<BusinessService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SaleUpdateUseCase,
        {
          provide: SaleService,
          useValue: {
            updateSale: jest.fn(),
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

    useCase = module.get<SaleUpdateUseCase>(SaleUpdateUseCase);
    saleService = module.get(SaleService);
    businessService = module.get(BusinessService);
  });

  it('should update sale successfully', async () => {
    const saleId = 'sale-123';
    const orgId = 'org-123';
    const saleData = { totalAmount: '100.00' };
    const business = { id: 'business-123' };
    const updatedSale = { id: saleId, ...saleData, businessId: business.id };

    businessService.getBusinessWithUserByOrgId.mockResolvedValue(business as any);
    saleService.updateSale.mockResolvedValue(updatedSale as any);

    const result = await useCase.execute(saleId, orgId, saleData);

    expect(businessService.getBusinessWithUserByOrgId).toHaveBeenCalledWith(orgId);
    expect(saleService.updateSale).toHaveBeenCalled();
    expect(result).toEqual(updatedSale);
  });

  it('should throw NotFoundException when business not found', async () => {
    const saleId = 'sale-123';
    const orgId = 'org-123';
    const saleData = { totalAmount: '100.00' };

    businessService.getBusinessWithUserByOrgId.mockResolvedValue(undefined);

    await expect(useCase.execute(saleId, orgId, saleData)).rejects.toThrow(NotFoundException);
  });
});
