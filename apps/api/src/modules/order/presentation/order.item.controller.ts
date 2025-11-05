import { Body, Controller, Delete, Param, Post, Put } from '@nestjs/common';
import { User } from '../../../shared/decorators/auth.decorator';
import { type AuthUserObject } from '../../../../globals';
import { CatchEntityErrors } from '../../../shared/decorators/exception.catcher';
import { ApiBody, ApiOperation, ApiParam } from '@nestjs/swagger';
import { ORDER_ITEM_API_OPERATIONS } from '../contants/api-operations';
import { OrderItemCreateUsecase } from '../application/order-item.create.usecase';
import { OrderItemUpdateUsecase } from '../application/order-item.update.usecase';
import { OrderItemDeleteUsecase } from '../application/order-item.delete.usecase';
import { CreateOrderItemDto, UpdateOrderItemDto } from '../dto/order-item.dto';

@Controller('order-item')
export class OrderItemController {
  constructor(
    private readonly orderItemCreateUsecase: OrderItemCreateUsecase,
    private readonly orderItemUpdateUseCase: OrderItemUpdateUsecase,
    private readonly orderItemDeleteUseCase: OrderItemDeleteUsecase,
  ) {}

  @ApiOperation({
    operationId: ORDER_ITEM_API_OPERATIONS.CREATE.operationId,
    description: ORDER_ITEM_API_OPERATIONS.CREATE.description,
  })
  @ApiBody({ type: CreateOrderItemDto })
  @Post('create')
  @CatchEntityErrors()
  createOrderItem(
    @Body() orderData: CreateOrderItemDto,
    @User() user: AuthUserObject,
  ) {
    return this.orderItemCreateUsecase.execute(user.orgId!, orderData);
  }

  @ApiOperation({
    operationId: ORDER_ITEM_API_OPERATIONS.UPDATE.operationId,
    description: ORDER_ITEM_API_OPERATIONS.UPDATE.description,
  })
  @ApiParam({ name: 'id', type: 'string', description: 'Order Item ID' })
  @ApiBody({ type: UpdateOrderItemDto })
  @Put('update/:id')
  @CatchEntityErrors()
  updateOrderItem(
    @Param('id') id: string,
    @Body() orderData: UpdateOrderItemDto,
    @User() user: AuthUserObject,
  ) {
    return this.orderItemUpdateUseCase.execute(id, user.orgId!, orderData);
  }

  @ApiOperation({
    operationId: ORDER_ITEM_API_OPERATIONS.DELETE.operationId,
    description: ORDER_ITEM_API_OPERATIONS.DELETE.description,
  })
  @ApiParam({ name: 'id', type: 'string', description: 'Order Item ID' })
  @Delete('delete/:id')
  @CatchEntityErrors()
  deleteOrderItem(@Param('id') id: string, @User() user: AuthUserObject) {
    return this.orderItemDeleteUseCase.execute(id, user.orgId!);
  }
}
