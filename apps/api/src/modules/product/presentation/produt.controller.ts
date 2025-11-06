import { Body, Controller, Delete, Param, Post, Put } from '@nestjs/common';
import { User } from '../../../shared/decorators/auth.decorator';
import { type AuthUserObject } from '../../../../globals';
import { CatchEntityErrors } from '../../../shared/decorators/exception.catcher';
import { ApiBody, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { ProductCreateUseCase } from '../application/product-create.usecase';
import { ProductUpdateUseCase } from '../application/product-update.usecase';
import { ProductDeleteUseCase } from '../application/product-delete.usecase';
import { CreateProductDto, UpdateProductDto } from '../dto/product.dto';
import { PRODUCT_API_OPERATIONS } from '../constant/api-operations.product';

@ApiTags('Product')
@Controller('product')
export class ProductsController {
  constructor(
    private readonly productCreateUseCase: ProductCreateUseCase,
    private readonly productUpdateUseCase: ProductUpdateUseCase,
    private readonly productDeleteUseCase: ProductDeleteUseCase,
  ) {}

  @ApiOperation({
    operationId: PRODUCT_API_OPERATIONS.CREATE_PRODUCT.operationId,
    description: PRODUCT_API_OPERATIONS.CREATE_PRODUCT.description,
  })
  @ApiBody({ type: CreateProductDto })
  @Post('create')
  @CatchEntityErrors()
  createProduct(
    @Body() productData: CreateProductDto,
    @User() user: AuthUserObject,
  ) {
    return this.productCreateUseCase.execute(user.orgId!, productData);
  }

  @ApiOperation({
    operationId: PRODUCT_API_OPERATIONS.UPDATE_PRODUCT.operationId,
    description: PRODUCT_API_OPERATIONS.UPDATE_PRODUCT.description,
  })
  @ApiBody({ type: UpdateProductDto })
  @ApiParam({ name: 'id', type: 'string', description: 'Product ID' })
  @Put('update/:id')
  @CatchEntityErrors()
  updateProduct(
    @Param('id') id: string,
    @Body() productData: UpdateProductDto,
    @User() user: AuthUserObject,
  ) {
    return this.productUpdateUseCase.execute(id, user.orgId!, productData);
  }

  @ApiOperation({
    operationId: PRODUCT_API_OPERATIONS.DELETE_PRODUCT.operationId,
    description: PRODUCT_API_OPERATIONS.DELETE_PRODUCT.description,
  })
  @ApiParam({ name: 'id', type: 'string', description: 'Product ID' })
  @Delete('delete/:id')
  @CatchEntityErrors()
  deleteProduct(@Param('id') id: string, @User() user: AuthUserObject) {
    return this.productDeleteUseCase.execute(id, user.orgId!);
  }
}
