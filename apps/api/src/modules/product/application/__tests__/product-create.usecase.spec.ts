import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ProductCreateUseCase } from '../product-create.usecase';
import { ProductService } from '../../infrastructure/product.service';
import { BusinessService } from '../../../business/infrastructure/business.service';

describe('ProductCreateUseCase', () => {
  let usecase: ProductCreateUseCase;
  let productService: jest.Mocked<ProductService>;
  let businessService: jest.Mocked<BusinessService>;

  beforeEach(async () => {
    const mockProductService = {
      createProduct: jest.fn(),
      assertReferencesInBusiness: jest.fn(),
    };

    const mockBusinessService = {
      getBusinessWithUserByOrgId: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductCreateUseCase,
        {
          provide: ProductService,
          useValue: mockProductService,
        },
        {
          provide: BusinessService,
          useValue: mockBusinessService,
        },
      ],
    }).compile();

    usecase = module.get<ProductCreateUseCase>(ProductCreateUseCase);
    productService = module.get(ProductService);
    businessService = module.get(BusinessService);
  });

  describe('execute', () => {
    const orgId = 'org-123';
    const productData = {
      name: 'Product A',
      sku: 'SKU-001',
      supplierId: 'supplier-123',
    };
    const mockBusiness = { id: 'business-123' };
    const mockProduct = { id: 'product-123', name: 'Product A' };

    it('should create a product successfully when business exists', async () => {
      businessService.getBusinessWithUserByOrgId.mockResolvedValue(
        mockBusiness as any,
      );
      productService.createProduct.mockResolvedValue(mockProduct as any);

      const result = await usecase.execute(orgId, productData as any);

      expect(businessService.getBusinessWithUserByOrgId).toHaveBeenCalledWith(
        orgId,
      );
      expect(productService.createProduct).toHaveBeenCalled();
      expect(productService.assertReferencesInBusiness).toHaveBeenCalledWith(
        'business-123',
        { supplierId: 'supplier-123', brandId: undefined },
      );
      expect(result).toEqual(mockProduct);
    });

    it('passes the request branch on so opening stock lands there', async () => {
      businessService.getBusinessWithUserByOrgId.mockResolvedValue(
        mockBusiness as any,
      );
      productService.createProduct.mockResolvedValue(mockProduct as any);

      await usecase.execute(orgId, productData as any, 'branch-1');

      expect(productService.createProduct).toHaveBeenCalledWith(
        expect.objectContaining({ businessId: 'business-123' }),
        'branch-1',
      );
    });

    it('should refuse a supplier or brand from another business', async () => {
      businessService.getBusinessWithUserByOrgId.mockResolvedValue(
        mockBusiness as any,
      );
      productService.assertReferencesInBusiness.mockRejectedValue(
        new NotFoundException('Supplier not found'),
      );

      await expect(usecase.execute(orgId, productData as any)).rejects.toThrow(
        'Supplier not found',
      );
      expect(productService.createProduct).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when business not found', async () => {
      businessService.getBusinessWithUserByOrgId.mockResolvedValue(null as any);

      await expect(usecase.execute(orgId, productData as any)).rejects.toThrow(
        NotFoundException,
      );
      expect(productService.createProduct).not.toHaveBeenCalled();
    });
  });
});
