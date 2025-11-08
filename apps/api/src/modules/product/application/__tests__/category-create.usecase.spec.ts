import { Test, TestingModule } from '@nestjs/testing';
import { CategoryCreateUseCase } from '../category-create.usecase';
import { CategoryService } from '../../infrastructure/category.service';
import { BusinessService } from '../../../business/infrastructure/business.service';
import { NotFoundException } from '@nestjs/common';

describe('CategoryCreateUseCase', () => {
  let useCase: CategoryCreateUseCase;
  let categoryService: jest.Mocked<CategoryService>;
  let businessService: jest.Mocked<BusinessService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoryCreateUseCase,
        {
          provide: CategoryService,
          useValue: {
            createCategory: jest.fn(),
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

    useCase = module.get<CategoryCreateUseCase>(CategoryCreateUseCase);
    categoryService = module.get(CategoryService);
    businessService = module.get(BusinessService);
  });

  it('should create category successfully', async () => {
    const orgId = 'org-123';
    const categoryData = { name: 'Electronics', businessId: 'business-123' };
    const business = { id: 'business-123' };
    const createdCategory = { id: 'category-123', ...categoryData };

    businessService.getBusinessWithUserByOrgId.mockResolvedValue(business as any);
    categoryService.createCategory.mockResolvedValue(createdCategory as any);

    const result = await useCase.execute(orgId, categoryData);

    expect(businessService.getBusinessWithUserByOrgId).toHaveBeenCalledWith(orgId);
    expect(categoryService.createCategory).toHaveBeenCalled();
    expect(result).toEqual(createdCategory);
  });

  it('should throw NotFoundException when business not found', async () => {
    const orgId = 'org-123';
    const categoryData = { name: 'Electronics', businessId: 'business-123' };

    businessService.getBusinessWithUserByOrgId.mockResolvedValue(undefined);

    await expect(useCase.execute(orgId, categoryData)).rejects.toThrow(NotFoundException);
  });
});
