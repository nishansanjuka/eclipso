import { Injectable } from '@nestjs/common/decorators/core/injectable.decorator';
import { BusinessService } from '../../business/infrastructure/business.service';
import { OrderService } from '../infrastructure/order.service';
import { NotFoundException } from '@nestjs/common';
import { InvoiceService } from '../../invoice/infrastructure/invoice.service';

// as an business owner, I want to delete an order
@Injectable()
export class OrderDeleteUsecase {
  constructor(
    private readonly businessService: BusinessService,
    private readonly orderService: OrderService,
    private readonly invoiceService: InvoiceService,
  ) {}

  async execute(id: string, orgId: string) {
    {
      const businessRes =
        await this.businessService.getBusinessWithUserByOrgId(orgId);

      if (!businessRes) {
        throw new NotFoundException(`Business not found`);
      } else {
        const { id: businessId } = businessRes;
        const orderRes = await this.orderService.getOrder(id, businessId);

        if (!orderRes) {
          throw new NotFoundException('Order Not found');
        }

        await this.invoiceService.deleteInvoice(orderRes.invoiceId);

        return this.orderService.deleteOrder(id, businessId);
      }
    }
  }
}
