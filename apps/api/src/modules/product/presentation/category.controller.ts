import { Body, Controller, Delete, Param, Post, Put } from '@nestjs/common';
import { User } from '../../../shared/decorators/auth.decorator';
import { type AuthUserObject } from '../../../../globals';
import { CatchEntityErrors } from '../../../shared/decorators/exception.catcher';
import { ApiBody, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { CATEGORY_API_OPERATIONS } from '../constant/api-operations.category';
import { CreateCategoryDto, UpdateCategoryDto } from '../dto/category.dto';
import { CategoryCreateUseCase } from '../application/category-create.usecase';
import { CategoryUpdateUseCase } from '../application/category-update.usecase';
import { CategoryDeleteUseCase } from '../application/category-delete.usecase';

@ApiTags('Product Category')
@Controller('category')
export class CategoriesController {
  constructor(
    private readonly categoryCreateUseCase: CategoryCreateUseCase,
    private readonly categoryUpdateUseCase: CategoryUpdateUseCase,
    private readonly categoryDeleteUseCase: CategoryDeleteUseCase,
  ) {}

  @ApiOperation({
    operationId: CATEGORY_API_OPERATIONS.CREATE_CATEGORY.operationId,
    description: CATEGORY_API_OPERATIONS.CREATE_CATEGORY.description,
  })
  @ApiBody({ type: CreateCategoryDto })
  @Post('create')
  @CatchEntityErrors()
  createCategory(
    @Body() categoryData: CreateCategoryDto,
    @User() user: AuthUserObject,
  ) {
    return this.categoryCreateUseCase.execute(user.orgId!, categoryData);
  }

  @ApiOperation({
    operationId: CATEGORY_API_OPERATIONS.UPDATE_CATEGORY.operationId,
    description: CATEGORY_API_OPERATIONS.UPDATE_CATEGORY.description,
  })
  @ApiBody({ type: UpdateCategoryDto })
  @ApiParam({ name: 'id', type: 'string', description: 'Category ID' })
  @Put('update/:id')
  @CatchEntityErrors()
  updateCategory(
    @Param('id') id: string,
    @Body() categoryData: UpdateCategoryDto,
    @User() user: AuthUserObject,
  ) {
    return this.categoryUpdateUseCase.execute(id, user.orgId!, categoryData);
  }

  @ApiOperation({
    operationId: CATEGORY_API_OPERATIONS.DELETE_CATEGORY.operationId,
    description: CATEGORY_API_OPERATIONS.DELETE_CATEGORY.description,
  })
  @ApiParam({ name: 'id', type: 'string', description: 'Category ID' })
  @Delete('delete/:id')
  @CatchEntityErrors()
  deleteCategory(@Param('id') id: string, @User() user: AuthUserObject) {
    return this.categoryDeleteUseCase.execute(id, user.orgId!);
  }
}
