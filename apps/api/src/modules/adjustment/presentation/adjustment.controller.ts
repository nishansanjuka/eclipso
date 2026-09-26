import { RequirePermissions } from '../../../shared/decorators/require-permissions.decorator';
import { PermissionType } from '../../auth/enums/auth-permissions.enum';
import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Put,
  Delete,
  Query,
  ParseIntPipe,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { AdjustmentService } from '../infrastructure/adjustment.service';
import { AdjustmentCreateUsecase } from '../application/adjustment.create.usecase';
import {
  UpdateAdjustmentDto,
  CreateAdjustmentDto,
} from '../dto/adjustment.dto';
import { requireBranchId } from '../../../shared/utils/require-branch';
import { User } from '../../../shared/decorators/auth.decorator';
import { type AuthUserObject } from '../../../../globals';
import { CatchEntityErrors } from '../../../shared/decorators/exception.catcher';
import { ADJUSTMENT_API_OPERATIONS } from '../constants/api-operations';

@ApiTags('Adjustments')
@Controller('adjustment')
export class AdjustmentController {
  constructor(
    private readonly adjustmentService: AdjustmentService,
    private readonly adjustmentCreateUsecase: AdjustmentCreateUsecase,
  ) {}

  @ApiOperation({
    operationId: ADJUSTMENT_API_OPERATIONS.CREATE.operationId,
    description: ADJUSTMENT_API_OPERATIONS.CREATE.description,
  })
  @RequirePermissions(PermissionType.INVENTORY_ADJUST)
  @Post(':productId')
  @ApiParam({ name: 'productId', description: 'Product ID' })
  @ApiQuery({
    name: 'qty',
    description: 'Quantity adjustment (positive to add, negative to subtract)',
  })
  @ApiBody({ type: CreateAdjustmentDto })
  @CatchEntityErrors()
  async createAdjustment(
    @Query('qty', ParseIntPipe) qty: number,
    @Param('productId') productId: string,
    @Body() dto: CreateAdjustmentDto,
    @User() user: AuthUserObject,
  ) {
    return await this.adjustmentCreateUsecase.execute(
      productId,
      qty,
      dto,
      user.businessId!,
      requireBranchId(user),
      user.userId,
    );
  }

  @ApiOperation({
    operationId: ADJUSTMENT_API_OPERATIONS.GET_BY_ID.operationId,
    description: ADJUSTMENT_API_OPERATIONS.GET_BY_ID.description,
  })
  @ApiParam({ name: 'id', description: 'Adjustment ID' })
  @RequirePermissions(PermissionType.INVENTORY_READ)
  @Get(':id')
  @CatchEntityErrors()
  async getAdjustmentById(
    @Param('id') id: string,
    @User() user: AuthUserObject,
  ) {
    const adjustment = await this.adjustmentService.findAdjustmentById(
      id,
      user.businessId!,
      user,
    );
    if (!adjustment) throw new NotFoundException('Adjustment not found');
    return adjustment;
  }

  @ApiOperation({
    operationId: ADJUSTMENT_API_OPERATIONS.GET_BY_BUSINESS.operationId,
    description: ADJUSTMENT_API_OPERATIONS.GET_BY_BUSINESS.description,
  })
  @ApiParam({ name: 'businessId', description: 'Business ID' })
  @RequirePermissions(PermissionType.INVENTORY_READ)
  @Get('business/:businessId')
  @CatchEntityErrors()
  async getAdjustmentsByBusinessId(
    @Param('businessId') businessId: string,
    @User() user: AuthUserObject,
  ) {
    // The path id is untrusted: only the caller's own business is readable.
    if (businessId !== user.businessId && businessId !== user.orgId) {
      throw new ForbiddenException('You do not have access to this business.');
    }
    return await this.adjustmentService.findAdjustmentsByBusinessId(
      user.businessId!,
      user,
    );
  }

  @ApiOperation({
    operationId: ADJUSTMENT_API_OPERATIONS.GET_BY_USER.operationId,
    description: ADJUSTMENT_API_OPERATIONS.GET_BY_USER.description,
  })
  @ApiParam({ name: 'userId', description: 'User clerk ID' })
  @RequirePermissions(PermissionType.INVENTORY_READ)
  @Get('user/:userId')
  @CatchEntityErrors()
  async getAdjustmentsByUserId(
    @Param('userId') userId: string,
    @User() user: AuthUserObject,
  ) {
    // Only adjustments made inside the caller's business.
    return await this.adjustmentService.findAdjustmentsByBusinessAndUser(
      user.businessId!,
      userId,
      user,
    );
  }

  @ApiOperation({
    operationId: ADJUSTMENT_API_OPERATIONS.GET_ALL.operationId,
    description: ADJUSTMENT_API_OPERATIONS.GET_ALL.description,
  })
  @ApiQuery({ name: 'limit', required: false, description: 'Limit results' })
  @CatchEntityErrors()
  @RequirePermissions(PermissionType.INVENTORY_READ)
  @Get()
  async getAllAdjustments(
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    @User() user: AuthUserObject = {} as AuthUserObject,
  ) {
    return await this.adjustmentService.getAllAdjustments(
      user.businessId!,
      user,
      limit,
    );
  }

  @ApiOperation({
    operationId: ADJUSTMENT_API_OPERATIONS.UPDATE.operationId,
    description: ADJUSTMENT_API_OPERATIONS.UPDATE.description,
  })
  @ApiParam({ name: 'id', description: 'Adjustment ID' })
  @ApiBody({ type: UpdateAdjustmentDto })
  @RequirePermissions(PermissionType.INVENTORY_ADJUST)
  @Put(':id')
  @CatchEntityErrors()
  async updateAdjustment(
    @Param('id') id: string,
    @Body() dto: UpdateAdjustmentDto,
    @User() user: AuthUserObject,
  ) {
    const updated = await this.adjustmentService.updateAdjustment(
      id,
      user.businessId!,
      dto,
      user,
    );
    if (!updated) throw new NotFoundException('Adjustment not found');
    return updated;
  }

  @ApiOperation({
    operationId: ADJUSTMENT_API_OPERATIONS.DELETE.operationId,
    description: ADJUSTMENT_API_OPERATIONS.DELETE.description,
  })
  @ApiParam({ name: 'id', description: 'Adjustment ID' })
  @RequirePermissions(PermissionType.INVENTORY_ADJUST)
  @Delete(':id')
  @CatchEntityErrors()
  async deleteAdjustment(
    @Param('id') id: string,
    @User() user: AuthUserObject,
  ) {
    return await this.adjustmentService.deleteAdjustment(
      id,
      user.businessId!,
      user,
    );
  }
}
