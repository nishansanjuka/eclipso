import { Test, TestingModule } from '@nestjs/testing';
import { ProductDeleteUseCase } from '../product-delete.usecase';
import { ProductService } from '../../infrastructure/product.service';
import { BusinessService } from '../../../business/infrastructure/business.service';
import { NotFoundException } from '@nestjs/common';

describe('ProductDeleteUseCase', () => {
  let useCase: ProductDeleteUseCase;
  let productService: jest.Mocked<ProductService>;
  let businessService: jest.Mocked<BusinessService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductDeleteUseCase,
        {
          provide: ProductService,
          useValue: {
            deleteProduct: jest.fn(),
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

    useCase = module.get<ProductDeleteUseCase>(ProductDeleteUseCase);
    productService = module.get(ProductService);
    businessService = module.get(BusinessService);
  });

  it('should delete product successfully', async () => {
    const productId = 'product-123';
    const orgId = 'org-123';
    const business = { id: 'business-123' };

    businessService.getBusinessWithUserByOrgId.mockResolvedValue(business as any);
    productService.deleteProduct.mockResolvedValue({} as any);

    await useCase.execute(productId, orgId);

    expect(businessService.getBusinessWithUserByOrgId).toHaveBeenCalledWith(orgId);
    expect(productService.deleteProduct).toHaveBeenCalledWith(productId, business.id);
  });

  it('should throw NotFoundException when business not found', async () => {
    const productId = 'product-123';
    const orgId = 'org-123';

    businessService.getBusinessWithUserByOrgId.mockResolvedValue(undefined);

    await expect(useCase.execute(productId, orgId)).rejects.toThrow(NotFoundException);
  });
});
