import { Body, Controller, Delete, Param, Post, Put } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam } from '@nestjs/swagger';
import { CatchEntityErrors } from '../../../shared/decorators/exception.catcher';
import { type AuthUserObject } from '../../../../globals';
import { User } from '../../../shared/decorators/auth.decorator';
import { DISCOUNT_API_OPERATIONS } from '../constants/api-operations';
import { CreateDiscountDto, UpdateDiscountDto } from '../dto/discount.dto';
import { DiscountCreateUsecase } from '../application/discount-create.usecase';
import { DiscountUpdateUsecase } from '../application/discount-update.usecase';
import { DiscountDeleteUsecase } from '../application/discount-delete.usecase';

@Controller('discount')
export class DiscountController {
  constructor(
    private readonly discountCreateUseCase: DiscountCreateUsecase,
    private readonly discountUpdateUseCase: DiscountUpdateUsecase,
    private readonly discountDeleteUseCase: DiscountDeleteUsecase,
  ) {}

  @ApiOperation({
    operationId: DISCOUNT_API_OPERATIONS.CREATE.operationId,
    description: DISCOUNT_API_OPERATIONS.CREATE.description,
  })
  @ApiBody({ type: CreateDiscountDto })
  @Post('create')
  @CatchEntityErrors()
  createDiscount(
    @Body() discountData: CreateDiscountDto,
    @User() user: AuthUserObject,
  ) {
    return this.discountCreateUseCase.execute(user.orgId!, discountData);
  }

  @ApiOperation({
    operationId: DISCOUNT_API_OPERATIONS.UPDATE.operationId,
    description: DISCOUNT_API_OPERATIONS.UPDATE.description,
  })
  @ApiParam({ name: 'id', type: 'string', description: 'Supplier ID' })
  @ApiBody({ type: UpdateDiscountDto })
  @Put('update/:id')
  @CatchEntityErrors()
  updateDiscount(
    @Param('id') id: string,
    @Body() discountData: UpdateDiscountDto,
    @User() user: AuthUserObject,
  ) {
    return this.discountUpdateUseCase.execute(id, user.orgId!, discountData);
  }

  @ApiOperation({
    operationId: DISCOUNT_API_OPERATIONS.DELETE.operationId,
    description: DISCOUNT_API_OPERATIONS.DELETE.description,
  })
  @ApiParam({ name: 'id', type: 'string', description: 'Discount ID' })
  @Delete('delete/:id')
  @CatchEntityErrors()
  deleteDiscount(@Param('id') id: string, @User() user: AuthUserObject) {
    return this.discountDeleteUseCase.execute(id, user.orgId!);
  }
}
