import { Test, TestingModule } from '@nestjs/testing';
import { BrandDeleteUsecase } from '../brand-delete.usecase';
import { BrandService } from '../../infrastructure/brand.service';
import { BusinessService } from '../../../business/infrastructure/business.service';
import { NotFoundException } from '@nestjs/common';

describe('BrandDeleteUsecase', () => {
  let usecase: BrandDeleteUsecase;
  let brandService: jest.Mocked<BrandService>;
  let businessService: jest.Mocked<BusinessService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BrandDeleteUsecase,
        {
          provide: BrandService,
          useValue: {
            deleteBrand: jest.fn(),
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

    usecase = module.get<BrandDeleteUsecase>(BrandDeleteUsecase);
    brandService = module.get(BrandService);
    businessService = module.get(BusinessService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    const brandId = 'brand-123';
    const orgId = 'org-123';
    const mockBusiness = { id: 'business-123' };

    it('should delete a brand successfully when business exists', async () => {
      businessService.getBusinessWithUserByOrgId.mockResolvedValue(
        mockBusiness as any,
      );
      brandService.deleteBrand.mockResolvedValue(undefined as any);

      await usecase.execute(orgId, brandId);

      expect(businessService.getBusinessWithUserByOrgId).toHaveBeenCalledWith(
        orgId,
      );
      expect(brandService.deleteBrand).toHaveBeenCalled();
    });

    it('should throw NotFoundException when business not found', async () => {
      businessService.getBusinessWithUserByOrgId.mockResolvedValue(null as any);

      await expect(usecase.execute(orgId, brandId)).rejects.toThrow(
        NotFoundException,
      );
      expect(brandService.deleteBrand).not.toHaveBeenCalled();
    });
  });
});
