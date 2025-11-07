import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { TaxDeleteUsecase } from '../tax-delete.usecase';
import { TaxService } from '../../infrastructure/tax.service';
import { BusinessService } from '../../../business/infrastructure/business.service';

describe('TaxDeleteUsecase', () => {
  let usecase: TaxDeleteUsecase;
  let taxService: jest.Mocked<TaxService>;
  let businessService: jest.Mocked<BusinessService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaxDeleteUsecase,
        {
          provide: TaxService,
          useValue: {
            deleteTax: jest.fn(),
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

    usecase = module.get<TaxDeleteUsecase>(TaxDeleteUsecase);
    taxService = module.get(TaxService);
    businessService = module.get(BusinessService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    const taxId = 'tax-123';
    const orgId = 'org-123';
    const mockBusiness = { id: 'business-123' };

    it('should delete a tax successfully when business exists', async () => {
      businessService.getBusinessWithUserByOrgId.mockResolvedValue(
        mockBusiness as any,
      );
      taxService.deleteTax.mockResolvedValue(undefined as any);

      await usecase.execute(orgId, taxId);

      expect(businessService.getBusinessWithUserByOrgId).toHaveBeenCalledWith(
        orgId,
      );
      expect(taxService.deleteTax).toHaveBeenCalled();
    });

    it('should throw NotFoundException when business not found', async () => {
      businessService.getBusinessWithUserByOrgId.mockResolvedValue(null as any);

      await expect(usecase.execute(orgId, taxId)).rejects.toThrow(
        NotFoundException,
      );
      expect(taxService.deleteTax).not.toHaveBeenCalled();
    });
  });
});
