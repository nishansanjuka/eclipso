import { Body, Controller, Delete, Param, Post, Put } from '@nestjs/common';
import { User } from '../../../shared/decorators/auth.decorator';
import { type AuthUserObject } from '../../../../globals';
import { SupplierCreateUseCase } from '../application/supplier-create.usecase';
import { SupplierCreateDto } from '../dto/supplier.dto';
import { CatchEntityErrors } from '../../../shared/decorators/exception.catcher';
import { ApiBody, ApiOperation } from '@nestjs/swagger';
import { SupplierUpdateUseCase } from '../application/supplier-update.usecase';
import { SupplierDeleteUseCase } from '../application/supplier-delete.usecase';
import { SUPPLIER_API_OPERATIONS } from '../constants/api-operations';

@Controller('suppliers')
export class SupplierController {
  constructor(
    private readonly supplierCreateUseCase: SupplierCreateUseCase,
    private readonly supplierUpdateUseCase: SupplierUpdateUseCase,
    private readonly supplierDeleteUseCase: SupplierDeleteUseCase,
  ) {}

  @ApiOperation({
    operationId: SUPPLIER_API_OPERATIONS.CREATE.operationId,
    description: SUPPLIER_API_OPERATIONS.CREATE.description,
  })
  @ApiBody({ type: SupplierCreateDto })
  @Post('create')
  @CatchEntityErrors()
  createSupplier(
    @Body() supplierData: SupplierCreateDto,
    @User() user: AuthUserObject,
  ) {
    return this.supplierCreateUseCase.execute(user.orgId!, supplierData);
  }

  @ApiOperation({
    operationId: SUPPLIER_API_OPERATIONS.UPDATE.operationId,
    description: SUPPLIER_API_OPERATIONS.UPDATE.description,
  })
  @ApiBody({ type: SupplierCreateDto })
  @Put('update/:id')
  @CatchEntityErrors()
  updateSupplier(
    @Param('id') id: string,
    @Body() supplierData: SupplierCreateDto,
    @User() user: AuthUserObject,
  ) {
    return this.supplierUpdateUseCase.execute(id, user.orgId!, supplierData);
  }

  @ApiOperation({
    operationId: SUPPLIER_API_OPERATIONS.DELETE.operationId,
    description: SUPPLIER_API_OPERATIONS.DELETE.description,
  })
  @Delete('delete/:id')
  @CatchEntityErrors()
  deleteSupplier(@Param('id') id: string, @User() user: AuthUserObject) {
    return this.supplierDeleteUseCase.execute(id, user.orgId!);
  }
}
