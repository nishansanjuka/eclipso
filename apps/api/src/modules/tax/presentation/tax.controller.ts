import { Body, Controller, Delete, Param, Post, Put } from '@nestjs/common';
import { TaxCreateUsecase } from '../application/tax-create.usecase';
import { TaxUpdateUsecase } from '../application/tax-update.usecase';
import { TaxDeleteUsecase } from '../application/tax-delete.usecase';
import { ApiBody, ApiOperation, ApiParam } from '@nestjs/swagger';
import { TAX_API_OPERATIONS } from '../constants/api-operations';
import { CatchEntityErrors } from '../../../shared/decorators/exception.catcher';
import { CreateTaxDto, UpdateTaxDto } from '../dto/tax.dto';
import { type AuthUserObject } from '../../../../globals';
import { User } from '../../../shared/decorators/auth.decorator';

@Controller('tax')
export class TaxController {
  constructor(
    private readonly taxCreateUseCase: TaxCreateUsecase,
    private readonly taxUpdateUseCase: TaxUpdateUsecase,
    private readonly taxDeleteUseCase: TaxDeleteUsecase,
  ) {}

  @ApiOperation({
    operationId: TAX_API_OPERATIONS.CREATE.operationId,
    description: TAX_API_OPERATIONS.CREATE.description,
  })
  @ApiBody({ type: CreateTaxDto })
  @Post('create')
  @CatchEntityErrors()
  createTax(@Body() taxData: CreateTaxDto, @User() user: AuthUserObject) {
    return this.taxCreateUseCase.execute(user.orgId!, taxData);
  }

  @ApiOperation({
    operationId: TAX_API_OPERATIONS.UPDATE.operationId,
    description: TAX_API_OPERATIONS.UPDATE.description,
  })
  @ApiParam({ name: 'id', type: 'string', description: 'Supplier ID' })
  @ApiBody({ type: UpdateTaxDto })
  @Put('update/:id')
  @CatchEntityErrors()
  updateTax(
    @Param('id') id: string,
    @Body() taxData: UpdateTaxDto,
    @User() user: AuthUserObject,
  ) {
    return this.taxUpdateUseCase.execute(id, user.orgId!, taxData);
  }

  @ApiOperation({
    operationId: TAX_API_OPERATIONS.DELETE.operationId,
    description: TAX_API_OPERATIONS.DELETE.description,
  })
  @ApiParam({ name: 'id', type: 'string', description: 'Tax ID' })
  @Delete('delete/:id')
  @CatchEntityErrors()
  deleteTax(@Param('id') id: string, @User() user: AuthUserObject) {
    return this.taxDeleteUseCase.execute(id, user.orgId!);
  }
}
