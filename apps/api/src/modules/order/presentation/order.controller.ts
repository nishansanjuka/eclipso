import { Body, Controller, Delete, Param, Post, Put } from '@nestjs/common';
import { User } from '../../../shared/decorators/auth.decorator';
import { type AuthUserObject } from '../../../../globals';
import { CatchEntityErrors } from '../../../shared/decorators/exception.catcher';
import { ApiBody, ApiOperation, ApiParam } from '@nestjs/swagger';
import { ORDER_API_OPERATIONS } from '../contants/api-operations';
import { OrderCreateDto, OrderUpdateDto } from '../dto/order.dto';
import { OrderCreateUsecase } from '../application/order.create.usecase';
import { OrderUpdateUsecase } from '../application/order.update.usecase';
import { OrderDeleteUsecase } from '../application/order.delete.usecase';

@Controller('orders')
export class OrderController {
  constructor(
    private readonly orderCreateUsecase: OrderCreateUsecase,
    private readonly orderUpdateUseCase: OrderUpdateUsecase,
    private readonly orderDeleteUseCase: OrderDeleteUsecase,
  ) {}

  @ApiOperation({
    operationId: ORDER_API_OPERATIONS.CREATE.operationId,
    description: ORDER_API_OPERATIONS.CREATE.description,
  })
  @ApiBody({ type: OrderCreateDto })
  @Post('create')
  @CatchEntityErrors()
  createOrder(@Body() orderData: OrderCreateDto, @User() user: AuthUserObject) {
    return this.orderCreateUsecase.execute(user.orgId!, orderData);
  }

  @ApiOperation({
    operationId: ORDER_API_OPERATIONS.UPDATE.operationId,
    description: ORDER_API_OPERATIONS.UPDATE.description,
  })
  @ApiParam({ name: 'id', type: 'string', description: 'Supplier ID' })
  @ApiBody({ type: OrderUpdateDto })
  @Put('update/:id')
  @CatchEntityErrors()
  updateOrder(
    @Param('id') id: string,
    @Body() orderData: OrderUpdateDto,
    @User() user: AuthUserObject,
  ) {
    return this.orderUpdateUseCase.execute(id, user.orgId!, orderData);
  }

  @ApiOperation({
    operationId: ORDER_API_OPERATIONS.DELETE.operationId,
    description: ORDER_API_OPERATIONS.DELETE.description,
  })
  @ApiParam({ name: 'id', type: 'string', description: 'Supplier ID' })
  @Delete('delete/:id')
  @CatchEntityErrors()
  deleteOrder(@Param('id') id: string, @User() user: AuthUserObject) {
    return this.orderDeleteUseCase.execute(id, user.orgId!);
  }
}
