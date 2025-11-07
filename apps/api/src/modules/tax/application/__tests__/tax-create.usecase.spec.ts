import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { TaxCreateUsecase } from '../tax-create.usecase';
import { TaxService } from '../../infrastructure/tax.service';
import { BusinessService } from '../../../business/infrastructure/business.service';

describe('TaxCreateUsecase', () => {
  let usecase: TaxCreateUsecase;
  let taxService: jest.Mocked<TaxService>;
  let businessService: jest.Mocked<BusinessService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaxCreateUsecase,
        {
          provide: TaxService,
          useValue: {
            createTax: jest.fn(),
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

    usecase = module.get<TaxCreateUsecase>(TaxCreateUsecase);
    taxService = module.get(TaxService);
    businessService = module.get(BusinessService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    const orgId = 'org-123';
    const taxData = { name: 'VAT', rate: '20.00', type: 'percentage' };
    const mockBusiness = { id: 'business-123' };
    const mockTax = { id: 'tax-123', name: 'VAT', rate: '20.00' };

    it('should create a tax successfully when business exists', async () => {
      businessService.getBusinessWithUserByOrgId.mockResolvedValue(
        mockBusiness as any,
      );
      taxService.createTax.mockResolvedValue(mockTax as any);

      const result = await usecase.execute(orgId, taxData as any);

      expect(businessService.getBusinessWithUserByOrgId).toHaveBeenCalledWith(
        orgId,
      );
      expect(taxService.createTax).toHaveBeenCalled();
      expect(result).toEqual(mockTax);
    });

    it('should throw NotFoundException when business not found', async () => {
      businessService.getBusinessWithUserByOrgId.mockResolvedValue(null as any);

      await expect(usecase.execute(orgId, taxData as any)).rejects.toThrow(
        NotFoundException,
      );
      expect(taxService.createTax).not.toHaveBeenCalled();
    });
  });
});
