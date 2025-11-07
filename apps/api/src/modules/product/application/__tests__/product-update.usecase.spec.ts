import { Test, TestingModule } from '@nestjs/testing';
import { ProductUpdateUseCase } from '../product-update.usecase';
import { ProductService } from '../../infrastructure/product.service';
import { BusinessService } from '../../../business/infrastructure/business.service';
import { NotFoundException } from '@nestjs/common';

describe('ProductUpdateUseCase', () => {
  let useCase: ProductUpdateUseCase;
  let productService: jest.Mocked<ProductService>;
  let businessService: jest.Mocked<BusinessService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductUpdateUseCase,
        {
          provide: ProductService,
          useValue: {
            updateProduct: jest.fn(),
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

    useCase = module.get<ProductUpdateUseCase>(ProductUpdateUseCase);
    productService = module.get(ProductService);
    businessService = module.get(BusinessService);
  });

  it('should update product successfully', async () => {
    const productId = 'product-123';
    const orgId = 'org-123';
    const productData = { name: 'Updated Product', businessId: 'business-123' };
    const business = { id: 'business-123' };
    const updatedProduct = { id: productId, ...productData };

    businessService.getBusinessWithUserByOrgId.mockResolvedValue(business as any);
    productService.updateProduct.mockResolvedValue(updatedProduct as any);

    const result = await useCase.execute(productId, orgId, productData);

    expect(businessService.getBusinessWithUserByOrgId).toHaveBeenCalledWith(orgId);
    expect(productService.updateProduct).toHaveBeenCalled();
    expect(result).toEqual(updatedProduct);
  });

  it('should throw NotFoundException when business not found', async () => {
    const productId = 'product-123';
    const orgId = 'org-123';
    const productData = { name: 'Updated Product', businessId: 'business-123' };

    businessService.getBusinessWithUserByOrgId.mockResolvedValue(undefined);

    await expect(useCase.execute(productId, orgId, productData)).rejects.toThrow(NotFoundException);
  });
});
