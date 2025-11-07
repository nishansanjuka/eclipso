import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { TaxUpdateUsecase } from '../tax-update.usecase';
import { TaxService } from '../../infrastructure/tax.service';
import { BusinessService } from '../../../business/infrastructure/business.service';

describe('TaxUpdateUsecase', () => {
  let usecase: TaxUpdateUsecase;
  let taxService: jest.Mocked<TaxService>;
  let businessService: jest.Mocked<BusinessService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaxUpdateUsecase,
        {
          provide: TaxService,
          useValue: {
            updateTax: jest.fn(),
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

    usecase = module.get<TaxUpdateUsecase>(TaxUpdateUsecase);
    taxService = module.get(TaxService);
    businessService = module.get(BusinessService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    const taxId = 'tax-123';
    const orgId = 'org-123';
    const taxData = { name: 'Updated VAT' };
    const mockBusiness = { id: 'business-123' };
    const mockTax = { id: 'tax-123', name: 'Updated VAT' };

    it('should update a tax successfully when business exists', async () => {
      businessService.getBusinessWithUserByOrgId.mockResolvedValue(
        mockBusiness as any,
      );
      taxService.updateTax.mockResolvedValue(mockTax as any);

      const result = await usecase.execute(orgId, taxId, taxData as any);

      expect(businessService.getBusinessWithUserByOrgId).toHaveBeenCalledWith(
        orgId,
      );
      expect(taxService.updateTax).toHaveBeenCalled();
      expect(result).toEqual(mockTax);
    });

    it('should throw NotFoundException when business not found', async () => {
      businessService.getBusinessWithUserByOrgId.mockResolvedValue(null as any);

      await expect(
        usecase.execute(orgId, taxId, taxData as any),
      ).rejects.toThrow(NotFoundException);
      expect(taxService.updateTax).not.toHaveBeenCalled();
    });
  });
});
