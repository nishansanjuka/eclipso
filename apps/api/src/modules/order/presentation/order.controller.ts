import { RequirePermissions } from '../../../shared/decorators/require-permissions.decorator';
import { PermissionType } from '../../auth/enums/auth-permissions.enum';
import { Body, Controller, Delete, Param, Post, Put } from '@nestjs/common';
import { User } from '../../../shared/decorators/auth.decorator';
import { type AuthUserObject } from '../../../../globals';
import { CatchEntityErrors } from '../../../shared/decorators/exception.catcher';
import { ApiBody, ApiOperation, ApiParam } from '@nestjs/swagger';
import { ORDER_API_OPERATIONS } from '../contants/api-operations';
import { CreateOrderDto, UpdateOrderDto } from '../dto/order.dto';
import { OrderCreateUsecase } from '../application/order.create.usecase';
import { OrderUpdateUsecase } from '../application/order.update.usecase';
import { OrderReceiveUsecase } from '../application/order.receive.usecase';
import { OrderDeleteUsecase } from '../application/order.delete.usecase';

@Controller('order')
export class OrderController {
  constructor(
    private readonly orderCreateUsecase: OrderCreateUsecase,
    private readonly orderUpdateUseCase: OrderUpdateUsecase,
    private readonly orderDeleteUseCase: OrderDeleteUsecase,
    private readonly orderReceiveUseCase: OrderReceiveUsecase,
  ) {}

  @ApiOperation({
    operationId: ORDER_API_OPERATIONS.CREATE.operationId,
    description: ORDER_API_OPERATIONS.CREATE.description,
  })
  @ApiBody({ type: CreateOrderDto })
  @RequirePermissions(PermissionType.ORDER_CREATE)
  @Post('create')
  @CatchEntityErrors()
  createOrder(@Body() orderData: CreateOrderDto, @User() user: AuthUserObject) {
    return this.orderCreateUsecase.execute(user.businessId!, orderData);
  }

  @ApiOperation({
    operationId: ORDER_API_OPERATIONS.UPDATE.operationId,
    description: ORDER_API_OPERATIONS.UPDATE.description,
  })
  @ApiParam({ name: 'id', type: 'string', description: 'Order ID' })
  @ApiBody({ type: UpdateOrderDto })
  @RequirePermissions(PermissionType.ORDER_UPDATE)
  @Put('update/:id')
  @CatchEntityErrors()
  updateOrder(
    @Param('id') id: string,
    @Body() orderData: UpdateOrderDto,
    @User() user: AuthUserObject,
  ) {
    return this.orderUpdateUseCase.execute(id, user.businessId!, orderData);
  }

  @ApiOperation({
    operationId: ORDER_API_OPERATIONS.DELETE.operationId,
    description: ORDER_API_OPERATIONS.DELETE.description,
  })
  @ApiParam({ name: 'id', type: 'string', description: 'Order ID' })
  @RequirePermissions(PermissionType.ORDER_UPDATE)
  @Delete('delete/:id')
  @CatchEntityErrors()
  deleteOrder(@Param('id') id: string, @User() user: AuthUserObject) {
    return this.orderDeleteUseCase.execute(id, user.businessId!);
  }

  @ApiOperation({
    operationId: ORDER_API_OPERATIONS.RECEIVE.operationId,
    description: ORDER_API_OPERATIONS.RECEIVE.description,
  })
  @ApiParam({ name: 'id', type: 'string', description: 'Order ID' })
  @RequirePermissions(PermissionType.ORDER_UPDATE)
  @Post('receive/:id')
  @CatchEntityErrors()
  receiveOrder(@Param('id') id: string, @User() user: AuthUserObject) {
    return this.orderReceiveUseCase.execute(id, user.businessId!);
  }
}
