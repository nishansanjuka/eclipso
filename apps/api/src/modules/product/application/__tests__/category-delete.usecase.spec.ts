import { Test, TestingModule } from '@nestjs/testing';
import { CategoryDeleteUseCase } from '../category-delete.usecase';
import { CategoryService } from '../../infrastructure/category.service';
import { BusinessService } from '../../../business/infrastructure/business.service';
import { NotFoundException } from '@nestjs/common';

describe('CategoryDeleteUseCase', () => {
  let useCase: CategoryDeleteUseCase;
  let categoryService: jest.Mocked<CategoryService>;
  let businessService: jest.Mocked<BusinessService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoryDeleteUseCase,
        {
          provide: CategoryService,
          useValue: {
            deleteCategory: jest.fn(),
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

    useCase = module.get<CategoryDeleteUseCase>(CategoryDeleteUseCase);
    categoryService = module.get(CategoryService);
    businessService = module.get(BusinessService);
  });

  it('should delete category successfully', async () => {
    const categoryId = 'category-123';
    const orgId = 'org-123';
    const business = { id: 'business-123' };

    businessService.getBusinessWithUserByOrgId.mockResolvedValue(business as any);
    categoryService.deleteCategory.mockResolvedValue({} as any);

    await useCase.execute(categoryId, orgId);

    expect(businessService.getBusinessWithUserByOrgId).toHaveBeenCalledWith(orgId);
    expect(categoryService.deleteCategory).toHaveBeenCalledWith(categoryId, business.id);
  });

  it('should throw NotFoundException when business not found', async () => {
    const categoryId = 'category-123';
    const orgId = 'org-123';

    businessService.getBusinessWithUserByOrgId.mockResolvedValue(undefined);

    await expect(useCase.execute(categoryId, orgId)).rejects.toThrow(NotFoundException);
  });
});
