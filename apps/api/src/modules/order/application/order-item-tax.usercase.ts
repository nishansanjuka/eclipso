import { Injectable, NotFoundException } from '@nestjs/common';
import { OrderItemTaxDto } from '../dto/order-item.tax';
import { OrderItemTaxEntity } from '../domain/orer.item.tax.entity';
import { OrderWorkflowRepository } from '../infrastructure/order-workflow.repository';
import { assertDraft } from './order-guards';

// as a business owner, I want to add or remove tax records associated with a draft order item,
// so that I can ensure accurate tax calculations for each item in an order.
@Injectable()
export class OrderItemTaxRecordUpdateUsecase {
  constructor(private readonly workflow: OrderWorkflowRepository) {}

  async add(orderTaxData: OrderItemTaxDto, businessId: string) {
    const data = new OrderItemTaxEntity(orderTaxData);

    return this.workflow.transaction(async (tx) => {
      const order = await this.workflow.lockOrderOfItem(
        tx,
        businessId,
        data.orderItemId,
      );
      if (!order) throw new NotFoundException('Order item not found');
      assertDraft(order);
      if (!(await this.workflow.taxInBusiness(tx, businessId, data.taxId))) {
        throw new NotFoundException('Tax not found');
      }

      await this.workflow.addItemTax(tx, data.orderItemId, data.taxId);
      return { orderItemId: data.orderItemId, taxId: data.taxId };
    });
  }

  async remove(orderTaxData: OrderItemTaxDto, businessId: string) {
    const data = new OrderItemTaxEntity(orderTaxData);

    return this.workflow.transaction(async (tx) => {
      const order = await this.workflow.lockOrderOfItem(
        tx,
        businessId,
        data.orderItemId,
      );
      if (!order) throw new NotFoundException('Order item not found');
      assertDraft(order);

      // Only the tax that was asked for, not every tax on the item.
      await this.workflow.removeItemTax(tx, data.orderItemId, data.taxId);
      return { orderItemId: data.orderItemId, taxId: data.taxId };
    });
  }
}
