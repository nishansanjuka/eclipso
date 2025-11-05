import { Injectable } from '@nestjs/common/decorators/core/injectable.decorator';
import { OrderItemService } from '../infrastructure/order-item.service';
import { NotFoundException } from '@nestjs/common';
import { OrderItemTaxDto } from '../dto/order-item.tax';
import { OrderItemTaxEntity } from '../domain/orer.item.tax.entity';

// as an business owner, I want to be able to add or remove tax records associated with an order item,
// so that I can ensure accurate tax calculations for each item in an order.
@Injectable()
export class OrderItemTaxRecordUpdateUsecase {
  constructor(private readonly orderItemService: OrderItemService) {}

  async add(orderTaxData: OrderItemTaxDto, orgId: string) {
    const res = await this.orderItemService.validateOrderItemOwnership(
      orderTaxData.orderItemId,
      orgId,
    );

    if (!res) {
      throw new NotFoundException(
        'Order item not found for the authorized organization',
      );
    }

    const orderItem = new OrderItemTaxEntity(orderTaxData);
    return await this.orderItemService.addTaxRecordsToOrderItem(
      orderItem.orderItemId,
      [orderItem.taxId],
    );
  }

  async remove(orderTaxData: OrderItemTaxDto, orgId: string) {
    const res = await this.orderItemService.validateOrderItemOwnership(
      orderTaxData.orderItemId,
      orgId,
    );

    if (!res) {
      throw new NotFoundException(
        'Order item not found for the authorized organization',
      );
    }

    const orderItem = new OrderItemTaxEntity(orderTaxData);
    return await this.orderItemService.removeTaxRecordsFromOrderItem(
      orderItem.orderItemId,
      [orderItem.taxId],
    );
  }
}
