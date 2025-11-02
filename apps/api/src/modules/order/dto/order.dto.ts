import { ApiProperty } from '@nestjs/swagger';
import { OrderStatus } from '../infrastructure/enums/order.enum';

export class OrderCreateDto {
  id?: string;
  businessId: string;
  @ApiProperty()
  supplierId: string;
  @ApiProperty()
  invoiceId: string;
  @ApiProperty()
  expireDate: Date;
  @ApiProperty()
  status: OrderStatus;
  @ApiProperty()
  totalAmount: number;
}
