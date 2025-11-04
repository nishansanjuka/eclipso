import { Injectable } from '@nestjs/common/decorators/core/injectable.decorator';
import { BusinessService } from '../../business/infrastructure/business.service';
import { InvoiceService } from '../../invoice/infrastructure/invoice.service';
import { OrderService } from '../infrastructure/order.service';
import { NotFoundException } from '@nestjs/common';
import { OrderCreateEntity } from '../domain/order.entity';
import { InvoiceCreateEntity } from '../../invoice/domain/invoice.entity';
import { OrderCreateDto } from '../dto/order.dto';

// as an business owner, I want to create a new order
@Injectable()
export class OrderCreateUsecase {
  constructor(
    private readonly businessService: BusinessService,
    private readonly invoiceService: InvoiceService,
    private readonly orderService: OrderService,
  ) {}

  async execute(orgId: string, orderData: OrderCreateDto) {
    {
      const res = await this.businessService.getBusinessWithUserByOrgId(orgId);

      if (!res) {
        throw new NotFoundException(`Business not found`);
      } else {
        const { id } = res;

        const invoiceData = new InvoiceCreateEntity({});
        const invoice = await this.invoiceService.createInvoice(invoiceData);

        const data = new OrderCreateEntity({
          ...orderData,
          businessId: id,
          invoiceId: invoice.id,
        });
        return this.orderService.createOrder(data);
      }
    }
  }
}
