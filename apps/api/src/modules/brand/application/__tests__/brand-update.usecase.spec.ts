import { Test, TestingModule } from '@nestjs/testing';
import { BrandUpdateUsecase } from '../brand-update.usecase';
import { BrandService } from '../../infrastructure/brand.service';
import { BusinessService } from '../../../business/infrastructure/business.service';
import { NotFoundException } from '@nestjs/common';

describe('BrandUpdateUsecase', () => {
  let usecase: BrandUpdateUsecase;
  let brandService: jest.Mocked<BrandService>;
  let businessService: jest.Mocked<BusinessService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BrandUpdateUsecase,
        {
          provide: BrandService,
          useValue: {
            updateBrand: jest.fn(),
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

    usecase = module.get<BrandUpdateUsecase>(BrandUpdateUsecase);
    brandService = module.get(BrandService);
    businessService = module.get(BusinessService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    const brandId = 'brand-123';
    const orgId = 'org-123';
    const brandData = { name: 'Updated Brand' };
    const mockBusiness = { id: 'business-123' };
    const mockBrand = { id: 'brand-123', name: 'Updated Brand' };

    it('should update a brand successfully when business exists', async () => {
      businessService.getBusinessWithUserByOrgId.mockResolvedValue(
        mockBusiness as any,
      );
      brandService.updateBrand.mockResolvedValue(mockBrand as any);

      const result = await usecase.execute(orgId, brandId, brandData as any);

      expect(businessService.getBusinessWithUserByOrgId).toHaveBeenCalledWith(
        orgId,
      );
      expect(brandService.updateBrand).toHaveBeenCalled();
      expect(result).toEqual(mockBrand);
    });

    it('should throw NotFoundException when business not found', async () => {
      businessService.getBusinessWithUserByOrgId.mockResolvedValue(null as any);

      await expect(
        usecase.execute(orgId, brandId, brandData as any),
      ).rejects.toThrow(NotFoundException);
      expect(brandService.updateBrand).not.toHaveBeenCalled();
    });
  });
});
