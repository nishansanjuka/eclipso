import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { DiscountCreateUsecase } from '../discount-create.usecase';
import { DiscountService } from '../../infrastructure/discount.service';
import { BusinessService } from '../../../business/infrastructure/business.service';

describe('DiscountCreateUsecase', () => {
  let usecase: DiscountCreateUsecase;
  let discountService: jest.Mocked<DiscountService>;
  let businessService: jest.Mocked<BusinessService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DiscountCreateUsecase,
        {
          provide: DiscountService,
          useValue: {
            createDiscount: jest.fn(),
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

    usecase = module.get<DiscountCreateUsecase>(DiscountCreateUsecase);
    discountService = module.get(DiscountService);
    businessService = module.get(BusinessService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    const orgId = 'org-123';
    const discountData = {
      name: 'Summer Sale',
      type: 'percentage',
      value: '20.00',
      start: new Date('2025-06-01'),
      end: new Date('2025-08-31'),
    };
    const mockBusiness = { id: 'business-123' };
    const mockDiscount = { id: 'discount-123', name: 'Summer Sale' };

    it('should create a discount successfully when business exists', async () => {
      businessService.getBusinessWithUserByOrgId.mockResolvedValue(
        mockBusiness as any,
      );
      discountService.createDiscount.mockResolvedValue(mockDiscount as any);

      const result = await usecase.execute(orgId, discountData as any);

      expect(businessService.getBusinessWithUserByOrgId).toHaveBeenCalledWith(
        orgId,
      );
      expect(discountService.createDiscount).toHaveBeenCalled();
      expect(result).toEqual(mockDiscount);
    });

    it('should throw NotFoundException when business not found', async () => {
      businessService.getBusinessWithUserByOrgId.mockResolvedValue(null as any);

      await expect(usecase.execute(orgId, discountData as any)).rejects.toThrow(
        NotFoundException,
      );
      expect(discountService.createDiscount).not.toHaveBeenCalled();
    });
  });
});
