import { Test, TestingModule } from '@nestjs/testing';
import { CategoryUpdateUseCase } from '../category-update.usecase';
import { CategoryService } from '../../infrastructure/category.service';
import { BusinessService } from '../../../business/infrastructure/business.service';
import { NotFoundException } from '@nestjs/common';

describe('CategoryUpdateUseCase', () => {
  let useCase: CategoryUpdateUseCase;
  let categoryService: jest.Mocked<CategoryService>;
  let businessService: jest.Mocked<BusinessService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoryUpdateUseCase,
        {
          provide: CategoryService,
          useValue: {
            updateCategory: jest.fn(),
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

    useCase = module.get<CategoryUpdateUseCase>(CategoryUpdateUseCase);
    categoryService = module.get(CategoryService);
    businessService = module.get(BusinessService);
  });

  it('should update category successfully', async () => {
    const categoryId = 'category-123';
    const orgId = 'org-123';
    const categoryData = { id: categoryId, name: 'Updated Electronics', businessId: 'business-123' };
    const business = { id: 'business-123' };
    const updatedCategory = { ...categoryData };

    businessService.getBusinessWithUserByOrgId.mockResolvedValue(business as any);
    categoryService.updateCategory.mockResolvedValue(updatedCategory as any);

    const result = await useCase.execute(categoryId, orgId, categoryData);

    expect(businessService.getBusinessWithUserByOrgId).toHaveBeenCalledWith(orgId);
    expect(categoryService.updateCategory).toHaveBeenCalled();
    expect(result).toEqual(updatedCategory);
  });

  it('should throw NotFoundException when business not found', async () => {
    const categoryId = 'category-123';
    const orgId = 'org-123';
    const categoryData = { id: categoryId, name: 'Updated Electronics', businessId: 'business-123' };

    businessService.getBusinessWithUserByOrgId.mockResolvedValue(undefined);

    await expect(useCase.execute(categoryId, orgId, categoryData)).rejects.toThrow(NotFoundException);
  });
});
