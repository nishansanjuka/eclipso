import { Body, Controller, Delete, Param, Post, Put } from '@nestjs/common';
import { User } from '../../../shared/decorators/auth.decorator';
import { type AuthUserObject } from '../../../../globals';
import { CatchEntityErrors } from '../../../shared/decorators/exception.catcher';
import { ApiBody, ApiOperation, ApiParam } from '@nestjs/swagger';
import { BrandCreateUsecase } from '../application/brand-create.usecase';
import { BrandUpdateUsecase } from '../application/brand-update.usecase';
import { BrandDeleteUsecase } from '../application/brand-delete.usecase';
import { CreateBrandDto, UpdateBrandDto } from '../dto/brand';
import { BRAND_API_OPERATIONS } from '../constants/api-operations';

@Controller('brand')
export class BrandController {
  constructor(
    private readonly brandCreateUsecase: BrandCreateUsecase,
    private readonly brandUpdateUseCase: BrandUpdateUsecase,
    private readonly brandDeleteUseCase: BrandDeleteUsecase,
  ) {}

  @ApiOperation({
    operationId: BRAND_API_OPERATIONS.CREATE.operationId,
    description: BRAND_API_OPERATIONS.CREATE.description,
  })
  @ApiBody({ type: CreateBrandDto })
  @Post('create')
  @CatchEntityErrors()
  createBrand(@Body() brandData: CreateBrandDto, @User() user: AuthUserObject) {
    return this.brandCreateUsecase.execute(user.orgId!, brandData);
  }

  @ApiOperation({
    operationId: BRAND_API_OPERATIONS.UPDATE.operationId,
    description: BRAND_API_OPERATIONS.UPDATE.description,
  })
  @ApiParam({ name: 'id', type: 'string', description: 'Brand ID' })
  @ApiBody({ type: UpdateBrandDto })
  @Put('update/:id')
  @CatchEntityErrors()
  updateBrand(
    @Param('id') id: string,
    @Body() brandData: UpdateBrandDto,
    @User() user: AuthUserObject,
  ) {
    return this.brandUpdateUseCase.execute(id, user.orgId!, brandData);
  }

  @ApiOperation({
    operationId: BRAND_API_OPERATIONS.DELETE.operationId,
    description: BRAND_API_OPERATIONS.DELETE.description,
  })
  @ApiParam({ name: 'id', type: 'string', description: 'Brand ID' })
  @Delete('delete/:id')
  @CatchEntityErrors()
  deleteBrand(@Param('id') id: string, @User() user: AuthUserObject) {
    return this.brandDeleteUseCase.execute(id, user.orgId!);
  }
}
