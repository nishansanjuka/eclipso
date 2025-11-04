import { ApiProperty } from '@nestjs/swagger';
import { OrderStatus } from '../infrastructure/enums/order.enum';

export class CreateOrderDto {
  id?: string;
  businessId: string;
  @ApiProperty()
  supplierId: string;
  invoiceId: string;
  @ApiProperty()
  expectedDate: Date;
  @ApiProperty()
  status: OrderStatus;
  @ApiProperty()
  totalAmount: number;
}

export class UpdateOrderDto {
  id?: string;
  businessId?: string;
  @ApiProperty()
  expectedDate?: Date;
  @ApiProperty()
  status?: OrderStatus;
}
