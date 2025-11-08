import { Test, TestingModule } from '@nestjs/testing';
import { DiscountUpdateUsecase } from '../discount-update.usecase';
import { DiscountService } from '../../infrastructure/discount.service';
import { BusinessService } from '../../../business/infrastructure/business.service';
import { NotFoundException } from '@nestjs/common';

describe('DiscountUpdateUsecase', () => {
  let useCase: DiscountUpdateUsecase;
  let discountService: jest.Mocked<DiscountService>;
  let businessService: jest.Mocked<BusinessService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DiscountUpdateUsecase,
        {
          provide: DiscountService,
          useValue: {
            updateDiscount: jest.fn(),
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

    useCase = module.get<DiscountUpdateUsecase>(DiscountUpdateUsecase);
    discountService = module.get(DiscountService);
    businessService = module.get(BusinessService);
  });

  it('should update discount successfully', async () => {
    const orgId = 'org-123';
    const discountId = 'discount-123';
    const discountData = { name: 'Updated Discount', value: '15.00', businessId: 'business-123' };
    const business = { id: 'business-123' };
    const updatedDiscount = { id: discountId, ...discountData };

    businessService.getBusinessWithUserByOrgId.mockResolvedValue(business as any);
    discountService.updateDiscount.mockResolvedValue(updatedDiscount as any);

    const result = await useCase.execute(orgId, discountId, discountData);

    expect(businessService.getBusinessWithUserByOrgId).toHaveBeenCalledWith(orgId);
    expect(discountService.updateDiscount).toHaveBeenCalled();
    expect(result).toEqual(updatedDiscount);
  });

  it('should throw NotFoundException when business not found', async () => {
    const orgId = 'org-123';
    const discountId = 'discount-123';
    const discountData = { name: 'Updated Discount', value: '15.00', businessId: 'business-123' };

    businessService.getBusinessWithUserByOrgId.mockResolvedValue(undefined);

    await expect(useCase.execute(orgId, discountId, discountData)).rejects.toThrow(NotFoundException);
  });
});
