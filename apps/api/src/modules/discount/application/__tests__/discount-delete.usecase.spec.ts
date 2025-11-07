import { Test, TestingModule } from '@nestjs/testing';
import { DiscountDeleteUsecase } from '../discount-delete.usecase';
import { DiscountService } from '../../infrastructure/discount.service';
import { BusinessService } from '../../../business/infrastructure/business.service';
import { NotFoundException } from '@nestjs/common';

describe('DiscountDeleteUsecase', () => {
  let useCase: DiscountDeleteUsecase;
  let discountService: jest.Mocked<DiscountService>;
  let businessService: jest.Mocked<BusinessService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DiscountDeleteUsecase,
        {
          provide: DiscountService,
          useValue: {
            deleteDiscount: jest.fn(),
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

    useCase = module.get<DiscountDeleteUsecase>(DiscountDeleteUsecase);
    discountService = module.get(DiscountService);
    businessService = module.get(BusinessService);
  });

  it('should delete discount successfully', async () => {
    const orgId = 'org-123';
    const discountId = 'discount-123';
    const business = { id: 'business-123' };

    businessService.getBusinessWithUserByOrgId.mockResolvedValue(business as any);
    discountService.deleteDiscount.mockResolvedValue([] as any);

    await useCase.execute(orgId, discountId);

    expect(businessService.getBusinessWithUserByOrgId).toHaveBeenCalledWith(orgId);
    expect(discountService.deleteDiscount).toHaveBeenCalledWith(discountId, business.id);
  });

  it('should throw NotFoundException when business not found', async () => {
    const orgId = 'org-123';
    const discountId = 'discount-123';

    businessService.getBusinessWithUserByOrgId.mockResolvedValue(undefined);

    await expect(useCase.execute(orgId, discountId)).rejects.toThrow(NotFoundException);
  });
});
