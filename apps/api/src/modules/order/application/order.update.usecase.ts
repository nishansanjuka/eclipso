import { Injectable } from '@nestjs/common/decorators/core/injectable.decorator';
import { BusinessService } from '../../business/infrastructure/business.service';
import { OrderService } from '../infrastructure/order.service';
import { NotFoundException } from '@nestjs/common';
import { OrderUpdateEntity } from '../domain/order.entity';
import { OrderUpdateDto } from '../dto/order.dto';

// as an business owner, I want to update an existing order
@Injectable()
export class OrderUpdateUsecase {
  constructor(
    private readonly businessService: BusinessService,
    private readonly orderService: OrderService,
  ) {}

  async execute(id: string, orgId: string, orderData: OrderUpdateDto) {
    {
      const res = await this.businessService.getBusinessWithUserByOrgId(orgId);

      if (!res) {
        throw new NotFoundException(`Business not found`);
      } else {
        const { id: businessId } = res;

        const data = new OrderUpdateEntity({
          ...orderData,
          businessId: businessId,
        });
        return this.orderService.updateOrder(id, data);
      }
    }
  }
}
