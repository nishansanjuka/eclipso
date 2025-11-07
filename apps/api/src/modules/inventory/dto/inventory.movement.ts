import { ApiProperty } from '@nestjs/swagger';
import { InventoryMovementTypeEnum } from '../infrastructure/enums/inventory.movement.enum';

export class CreateInventoryMovementDto {
  id?: string;
  @ApiProperty({ description: 'The ID of the product' })
  productId: string;
  @ApiProperty({ description: 'The ID of the order', required: false })
  orderId?: string;
  @ApiProperty({ description: 'The ID of the sale', required: false })
  saleId?: string;
  @ApiProperty({ description: 'The ID of the adjustment', required: false })
  adjustmentId?: string;
  @ApiProperty({ description: 'The quantity of the product' })
  qty: number;
  @ApiProperty({ description: 'The type of inventory movement' })
  movementType: InventoryMovementTypeEnum;
}

export class UpdateInventoryMovementDto {
  id?: string;
  @ApiProperty({ required: false })
  qty?: number;
  @ApiProperty({ required: false })
  movementType?: InventoryMovementTypeEnum;
  @ApiProperty({ required: false })
  adjustmentId?: string;
}
