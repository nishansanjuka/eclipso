import { Injectable, NotFoundException } from '@nestjs/common';
import { BusinessService } from '../../business/infrastructure/business.service';
import { AdjustmentService } from '../infrastructure/adjustment.service';
import { InventoryMovementService } from '../../inventory/infrastructure/inventory.movements.service';
import { CreateAdjustmentDto } from '../dto/adjustment.dto';
import { AdjustmentCreateEntity } from '../domain/adjustment.entity';
import { InventoryMovementTypeEnum } from '../../inventory/infrastructure/enums/inventory.movement.enum';
import { UserService } from '../../users/infrastructure/user.service';
import { ProductService } from '../../product/infrastructure/product.service';
import { sql } from 'drizzle-orm';

// as an business owner, I want to create an inventory adjustment
@Injectable()
export class AdjustmentCreateUsecase {
  constructor(
    private readonly businessService: BusinessService,
    private readonly adjustmentService: AdjustmentService,
    private readonly inventoryMovementService: InventoryMovementService,
    private readonly userService: UserService,
    private readonly productService: ProductService,
  ) {}

  async execute(
    productId: string,
    quantity: number,
    data: CreateAdjustmentDto,
    orgId: string,
    clerkId: string,
  ) {
    // Validate business exists
    const business =
      await this.businessService.getBusinessWithUserByOrgId(orgId);

    if (!business) {
      throw new NotFoundException(`Business not found`);
    }

    const user = await this.userService.getUserByClerkId(clerkId);

    if (!user) {
      throw new NotFoundException(`User not found`);
    }

    // Create adjustment entity with validated data
    const adjustmentEntity = new AdjustmentCreateEntity({
      businessId: business.id,
      userId: user.id,
      reason: data.reason,
    });

    // Create adjustment record
    const adjustment =
      await this.adjustmentService.createAdjustment(adjustmentEntity);

    // Create inventory movement for the adjustment
    await this.inventoryMovementService.create({
      productId: productId,
      qty: quantity,
      adjustmentId: adjustment.id,
      movementType: InventoryMovementTypeEnum.ADJUSTMENT,
    });

    await this.productService.updateProductStockBySql(
      productId,
      business.id,
      sql`stock_qty + ${quantity}`,
    );

    return adjustment;
  }
}
