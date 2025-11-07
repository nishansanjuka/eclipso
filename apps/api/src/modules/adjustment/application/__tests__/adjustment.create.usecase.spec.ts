import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { AdjustmentCreateUsecase } from '../adjustment.create.usecase';
import { AdjustmentService } from '../../infrastructure/adjustment.service';
import { BusinessService } from '../../../business/infrastructure/business.service';
import { InventoryMovementService } from '../../../inventory/infrastructure/inventory.movements.service';
import { UserService } from '../../../users/infrastructure/user.service';
import { ProductService } from '../../../product/infrastructure/product.service';

describe('AdjustmentCreateUsecase', () => {
  let usecase: AdjustmentCreateUsecase;
  let adjustmentService: jest.Mocked<AdjustmentService>;
  let businessService: jest.Mocked<BusinessService>;
  let inventoryMovementService: jest.Mocked<InventoryMovementService>;
  let userService: jest.Mocked<UserService>;
  let productService: jest.Mocked<ProductService>;

  beforeEach(async () => {
    const mockAdjustmentService = {
      createAdjustment: jest.fn(),
    };

    const mockBusinessService = {
      getBusinessWithUserByOrgId: jest.fn(),
    };

    const mockInventoryMovementService = {
      create: jest.fn(),
    };

    const mockUserService = {
      getUserByClerkId: jest.fn(),
    };

    const mockProductService = {
      updateProductStockBySql: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdjustmentCreateUsecase,
        {
          provide: AdjustmentService,
          useValue: mockAdjustmentService,
        },
        {
          provide: BusinessService,
          useValue: mockBusinessService,
        },
        {
          provide: InventoryMovementService,
          useValue: mockInventoryMovementService,
        },
        {
          provide: UserService,
          useValue: mockUserService,
        },
        {
          provide: ProductService,
          useValue: mockProductService,
        },
      ],
    }).compile();

    usecase = module.get<AdjustmentCreateUsecase>(AdjustmentCreateUsecase);
    adjustmentService = module.get(AdjustmentService);
    businessService = module.get(BusinessService);
    inventoryMovementService = module.get(InventoryMovementService);
    userService = module.get(UserService);
    productService = module.get(ProductService);
  });

  describe('execute', () => {
    const productId = 'product-123';
    const quantity = 10;
    const adjustmentData = {
      reason: 'Stock count correction',
    };
    const orgId = 'org-123';
    const clerkId = 'clerk-123';
    const mockBusiness = { id: '550e8400-e29b-41d4-a716-446655440000' }; // Valid UUID
    const mockUser = { id: 'user-123' };
    const mockAdjustment = { id: 'adjustment-123' };

    it('should create an adjustment successfully when business and user exist', async () => {
      businessService.getBusinessWithUserByOrgId.mockResolvedValue(
        mockBusiness as any,
      );
      userService.getUserByClerkId.mockResolvedValue(mockUser as any);
      adjustmentService.createAdjustment.mockResolvedValue(
        mockAdjustment as any,
      );
      inventoryMovementService.create.mockResolvedValue(undefined as any);
      productService.updateProductStockBySql.mockResolvedValue(
        undefined as any,
      );

      const result = await usecase.execute(
        productId,
        quantity,
        adjustmentData as any,
        orgId,
        clerkId,
      );

      expect(businessService.getBusinessWithUserByOrgId).toHaveBeenCalledWith(
        orgId,
      );
      expect(userService.getUserByClerkId).toHaveBeenCalledWith(clerkId);
      expect(adjustmentService.createAdjustment).toHaveBeenCalled();
      expect(inventoryMovementService.create).toHaveBeenCalled();
      expect(productService.updateProductStockBySql).toHaveBeenCalled();
      expect(result).toEqual(mockAdjustment);
    });

    it('should throw NotFoundException when business not found', async () => {
      businessService.getBusinessWithUserByOrgId.mockResolvedValue(null as any);

      await expect(
        usecase.execute(
          productId,
          quantity,
          adjustmentData as any,
          orgId,
          clerkId,
        ),
      ).rejects.toThrow(NotFoundException);
      expect(adjustmentService.createAdjustment).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when user not found', async () => {
      businessService.getBusinessWithUserByOrgId.mockResolvedValue(
        mockBusiness as any,
      );
      userService.getUserByClerkId.mockResolvedValue(null as any);

      await expect(
        usecase.execute(
          productId,
          quantity,
          adjustmentData as any,
          orgId,
          clerkId,
        ),
      ).rejects.toThrow(NotFoundException);
      expect(adjustmentService.createAdjustment).not.toHaveBeenCalled();
    });
  });
});
