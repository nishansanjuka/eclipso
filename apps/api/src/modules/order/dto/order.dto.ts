import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OrderStatus } from '../infrastructure/enums/order.enum';

/**
 * Purchase order request. Status, totals and the invoice are not accepted:
 * orders start as `draft`, the total is the sum of their items, and stock is
 * only added when the order is received.
 */
export class CreateOrderDto {
  @ApiProperty({ format: 'uuid' })
  supplierId: string;
  @ApiProperty({ description: 'ISO date, must be in the future.' })
  expectedDate: string;
}

export class UpdateOrderDto {
  @ApiPropertyOptional({ description: 'ISO date, must be in the future.' })
  expectedDate?: string;
  @ApiPropertyOptional({
    enum: [OrderStatus.CANCEL],
    description:
      'Only `cancel` can be set here. Use the receive endpoint to receive an order.',
  })
  status?: OrderStatus;
}
