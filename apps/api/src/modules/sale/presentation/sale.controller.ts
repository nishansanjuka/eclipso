import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { User } from '../../../shared/decorators/auth.decorator';
import { type AuthUserObject } from '../../../../globals';
import { SaleCreateUseCase } from '../application/sale-create.usecase';
import { CreateSaleDto } from '../dto/sale.dto';
import { CatchEntityErrors } from '../../../shared/decorators/exception.catcher';
import { ApiBody, ApiOperation, ApiParam } from '@nestjs/swagger';
import { SALE_API_OPERATIONS } from '../constants/api-operations';
import { SaleUpdateUseCase } from '../application/sale-update.usecase';
import { SaleDeleteUseCase } from '../application/sale-delete.usecase';
import { SaleGetUseCase } from '../application/sale-get.usecase';

@Controller('sales')
export class SaleController {
  constructor(
    private readonly saleCreateUseCase: SaleCreateUseCase,
    private readonly saleUpdateUseCase: SaleUpdateUseCase,
    private readonly saleDeleteUseCase: SaleDeleteUseCase,
    private readonly saleGetUseCase: SaleGetUseCase,
  ) {}

  @ApiOperation({
    operationId: SALE_API_OPERATIONS.CREATE.operationId,
    description: SALE_API_OPERATIONS.CREATE.description,
  })
  @ApiBody({ type: CreateSaleDto })
  @Post('create')
  @CatchEntityErrors()
  createSale(@Body() saleData: CreateSaleDto, @User() user: AuthUserObject) {
    return this.saleCreateUseCase.execute(user.orgId!, saleData);
  }

  @ApiOperation({
    operationId: SALE_API_OPERATIONS.UPDATE.operationId,
    description: SALE_API_OPERATIONS.UPDATE.description,
  })
  @ApiParam({ name: 'id', type: 'string', description: 'Sale ID' })
  @ApiBody({ type: CreateSaleDto })
  @Put('update/:id')
  @CatchEntityErrors()
  updateSale(
    @Param('id') id: string,
    @Body() saleData: Partial<CreateSaleDto>,
    @User() user: AuthUserObject,
  ) {
    return this.saleUpdateUseCase.execute(id, user.orgId!, saleData);
  }

  @ApiOperation({
    operationId: SALE_API_OPERATIONS.DELETE.operationId,
    description: SALE_API_OPERATIONS.DELETE.description,
  })
  @ApiParam({ name: 'id', type: 'string', description: 'Sale ID' })
  @Delete('delete/:id')
  @CatchEntityErrors()
  deleteSale(@Param('id') id: string, @User() user: AuthUserObject) {
    return this.saleDeleteUseCase.execute(id, user.orgId!);
  }

  @ApiOperation({
    operationId: SALE_API_OPERATIONS.GET.operationId,
    description: SALE_API_OPERATIONS.GET.description,
  })
  @ApiParam({ name: 'id', type: 'string', description: 'Sale ID' })
  @Get(':id')
  @CatchEntityErrors()
  getSale(@Param('id') id: string, @User() user: AuthUserObject) {
    return this.saleGetUseCase.execute(id, user.orgId!);
  }
}
