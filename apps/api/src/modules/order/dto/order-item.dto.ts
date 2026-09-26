import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateOrderItemDto {
  @ApiProperty({ format: 'uuid' })
  orderId: string;
  @ApiProperty({ format: 'uuid' })
  productId: string;
  @ApiProperty({ minimum: 1 })
  qty: number;
  @ApiProperty({ description: 'Unit cost in minor units.', minimum: 0 })
  price: number;
}

export class UpdateOrderItemDto {
  @ApiPropertyOptional({ minimum: 1 })
  qty?: number;
  @ApiPropertyOptional({ minimum: 0 })
  price?: number;
}
