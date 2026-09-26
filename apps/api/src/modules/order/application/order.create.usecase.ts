import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateOrderDto } from '../dto/order.dto';
import { OrderCreateEntity } from '../domain/order.entity';
import { OrderStatus } from '../infrastructure/enums/order.enum';
import { OrderWorkflowRepository } from '../infrastructure/order-workflow.repository';
import { BranchStockRepository } from '../../inventory/infrastructure/branch-stock.repository';

// as a business owner, I want to create a purchase order for one of my suppliers
@Injectable()
export class OrderCreateUsecase {
  constructor(
    private readonly workflow: OrderWorkflowRepository,
    private readonly stock: BranchStockRepository,
  ) {}

  async execute(
    businessId: string,
    branchId: string,
    orderData: CreateOrderDto,
  ) {
    const data = new OrderCreateEntity(orderData);

    return this.workflow.transaction(async (tx) => {
      await this.stock.assertBranchOperable(tx, businessId, branchId);
      if (
        !(await this.workflow.supplierInBusiness(
          tx,
          businessId,
          data.supplierId,
        ))
      ) {
        throw new NotFoundException('Supplier not found');
      }

      // Always a draft with a zero total; both change only through the items
      // and the receive step, never through the request.
      return this.workflow.insertOrderWithInvoice(tx, {
        businessId,
        branchId,
        supplierId: data.supplierId,
        expectedDate: data.expectedDate,
        status: OrderStatus.DRAFT,
        totalAmount: 0,
      });
    });
  }
}
