import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { BrandCreateUsecase } from '../brand-create.usecase';
import { BrandService } from '../../infrastructure/brand.service';
import { BusinessService } from '../../../business/infrastructure/business.service';

describe('BrandCreateUsecase', () => {
  let usecase: BrandCreateUsecase;
  let brandService: jest.Mocked<BrandService>;
  let businessService: jest.Mocked<BusinessService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BrandCreateUsecase,
        {
          provide: BrandService,
          useValue: {
            createBrand: jest.fn(),
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

    usecase = module.get<BrandCreateUsecase>(BrandCreateUsecase);
    brandService = module.get(BrandService);
    businessService = module.get(BusinessService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    const orgId = 'org-123';
    const brandData = {
      name: 'Test Brand',
      slug: 'test-brand',
      description: 'Test brand description',
    };
    const mockBusiness = { id: 'business-123', name: 'Test Business' };
    const mockBrand = {
      id: 'brand-123',
      name: 'Test Brand',
      businessId: 'business-123',
    };

    it('should create a brand successfully when business exists', async () => {
      businessService.getBusinessWithUserByOrgId.mockResolvedValue(
        mockBusiness as any,
      );
      brandService.createBrand.mockResolvedValue(mockBrand as any);

      const result = await usecase.execute(orgId, brandData as any);

      expect(businessService.getBusinessWithUserByOrgId).toHaveBeenCalledWith(
        orgId,
      );
      expect(brandService.createBrand).toHaveBeenCalled();
      expect(result).toEqual(mockBrand);
    });

    it('should throw NotFoundException when business not found', async () => {
      businessService.getBusinessWithUserByOrgId.mockResolvedValue(null as any);

      await expect(usecase.execute(orgId, brandData as any)).rejects.toThrow(
        NotFoundException,
      );
      await expect(usecase.execute(orgId, brandData as any)).rejects.toThrow(
        'Business not found',
      );
      expect(brandService.createBrand).not.toHaveBeenCalled();
    });
  });
});
