import { RequirePermissions } from '../../../shared/decorators/require-permissions.decorator';
import { PermissionType } from '../../auth/enums/auth-permissions.enum';
import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { requireBranchId } from '../../../shared/utils/require-branch';
import { User } from '../../../shared/decorators/auth.decorator';
import { type AuthUserObject } from '../../../../globals';
import { SaleCreateUseCase } from '../application/sale-create.usecase';
import { CreateSaleDto, UpdateSaleDto, VoidSaleDto } from '../dto/sale.dto';
import { CatchEntityErrors } from '../../../shared/decorators/exception.catcher';
import { ApiBody, ApiHeader, ApiOperation, ApiParam } from '@nestjs/swagger';
import { SALE_API_OPERATIONS } from '../constants/api-operations';
import { SaleUpdateUseCase } from '../application/sale-update.usecase';
import { SaleVoidUseCase } from '../application/sale-void.usecase';
import { SaleGetUseCase } from '../application/sale-get.usecase';

@Controller('sales')
export class SaleController {
  constructor(
    private readonly saleCreateUseCase: SaleCreateUseCase,
    private readonly saleUpdateUseCase: SaleUpdateUseCase,
    private readonly saleVoidUseCase: SaleVoidUseCase,
    private readonly saleGetUseCase: SaleGetUseCase,
  ) {}

  @ApiOperation({
    operationId: SALE_API_OPERATIONS.CREATE.operationId,
    description: SALE_API_OPERATIONS.CREATE.description,
  })
  @ApiBody({ type: CreateSaleDto })
  @ApiHeader({
    name: 'Idempotency-Key',
    required: false,
    description:
      'Unique key per checkout attempt. Retrying with the same key returns the original sale instead of creating a duplicate.',
  })
  @RequirePermissions(PermissionType.SALE_CREATE)
  @Post('create')
  @CatchEntityErrors()
  createSale(
    @Body() saleData: CreateSaleDto,
    @User() user: AuthUserObject,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    return this.saleCreateUseCase.execute(
      user.businessId!,
      requireBranchId(user),
      user.userId,
      saleData,
      idempotencyKey,
    );
  }

  @ApiOperation({
    operationId: SALE_API_OPERATIONS.UPDATE.operationId,
    description: SALE_API_OPERATIONS.UPDATE.description,
  })
  @ApiParam({ name: 'id', type: 'string', description: 'Sale ID' })
  @ApiBody({ type: UpdateSaleDto })
  @RequirePermissions(PermissionType.SALE_MANAGE)
  @Put('update/:id')
  @CatchEntityErrors()
  updateSale(
    @Param('id') id: string,
    @Body() saleData: UpdateSaleDto,
    @User() user: AuthUserObject,
  ) {
    return this.saleUpdateUseCase.execute(id, user.businessId!, saleData, user);
  }

  @ApiOperation({
    operationId: SALE_API_OPERATIONS.VOID.operationId,
    description: SALE_API_OPERATIONS.VOID.description,
  })
  @ApiParam({ name: 'id', type: 'string', description: 'Sale ID' })
  @ApiBody({ type: VoidSaleDto })
  @RequirePermissions(PermissionType.SALE_MANAGE)
  @Post('void/:id')
  @CatchEntityErrors()
  voidSale(
    @Param('id') id: string,
    @Body() body: VoidSaleDto,
    @User() user: AuthUserObject,
  ) {
    return this.saleVoidUseCase.execute(
      id,
      user.businessId!,
      user.userId,
      body,
      user,
    );
  }

  @ApiOperation({
    operationId: SALE_API_OPERATIONS.GET.operationId,
    description: SALE_API_OPERATIONS.GET.description,
  })
  @ApiParam({ name: 'id', type: 'string', description: 'Sale ID' })
  @RequirePermissions(PermissionType.SALE_READ)
  @Get(':id')
  @CatchEntityErrors()
  getSale(@Param('id') id: string, @User() user: AuthUserObject) {
    return this.saleGetUseCase.execute(id, user.orgId!, user);
  }
}
