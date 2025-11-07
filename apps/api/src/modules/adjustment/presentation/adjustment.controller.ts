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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';
import { AdjustmentService } from '../infrastructure/adjustment.service';
import { AdjustmentCreateUsecase } from '../application/adjustment.create.usecase';
import {
  UpdateAdjustmentDto,
  CreateAdjustmentDto,
} from '../dto/adjustment.dto';
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

  @Post(':productId')
  @CatchEntityErrors()
  @ApiParam({ name: 'productId', description: 'Product ID' })
  @ApiQuery({
    name: 'qty',
    description: 'Quantity adjustment (positive to add, negative to subtract)',
  })
  @ApiOperation({
    summary: 'Create inventory adjustment',
    operationId: ADJUSTMENT_API_OPERATIONS.CREATE.operationId,
    description: ADJUSTMENT_API_OPERATIONS.CREATE.description,
  })
  async createAdjustment(
    @Query('qty') qty: number,
    @Param('productId') productId: string,
    @Body() dto: CreateAdjustmentDto,
    @User() user: AuthUserObject,
  ) {
    return await this.adjustmentCreateUsecase.execute(
      productId,
      qty,
      dto,
      user.orgId!,
      user.userId!,
    );
  }

  @Get(':id')
  @CatchEntityErrors()
  @ApiOperation({
    summary: 'Get adjustment by ID',
    operationId: ADJUSTMENT_API_OPERATIONS.GET_BY_ID.operationId,
    description: ADJUSTMENT_API_OPERATIONS.GET_BY_ID.description,
  })
  @ApiParam({ name: 'id', description: 'Adjustment ID' })
  async getAdjustmentById(@Param('id') id: string) {
    return await this.adjustmentService.findAdjustmentById(id);
  }

  @Get('business/:businessId')
  @CatchEntityErrors()
  @ApiOperation({
    summary: 'Get all adjustments for a business',
    operationId: ADJUSTMENT_API_OPERATIONS.GET_BY_BUSINESS.operationId,
    description: ADJUSTMENT_API_OPERATIONS.GET_BY_BUSINESS.description,
  })
  @ApiParam({ name: 'businessId', description: 'Business ID' })
  async getAdjustmentsByBusinessId(@Param('businessId') businessId: string) {
    return await this.adjustmentService.findAdjustmentsByBusinessId(businessId);
  }

  @Get('user/:userId')
  @CatchEntityErrors()
  @ApiOperation({
    summary: 'Get all adjustments by a user',
    operationId: ADJUSTMENT_API_OPERATIONS.GET_BY_USER.operationId,
    description: ADJUSTMENT_API_OPERATIONS.GET_BY_USER.description,
  })
  @ApiParam({ name: 'userId', description: 'User clerk ID' })
  async getAdjustmentsByUserId(@Param('userId') userId: string) {
    return await this.adjustmentService.findAdjustmentsByUserId(userId);
  }

  @Get()
  @CatchEntityErrors()
  @ApiOperation({
    summary: 'Get all adjustments with optional limit',
    operationId: ADJUSTMENT_API_OPERATIONS.GET_ALL.operationId,
    description: ADJUSTMENT_API_OPERATIONS.GET_ALL.description,
  })
  @ApiQuery({ name: 'limit', required: false, description: 'Limit results' })
  async getAllAdjustments(
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    @User() user: AuthUserObject = {} as AuthUserObject,
  ) {
    return await this.adjustmentService.getAllAdjustments(user.orgId!, limit);
  }

  @Put(':id')
  @CatchEntityErrors()
  @ApiOperation({
    summary: 'Update adjustment',
    operationId: ADJUSTMENT_API_OPERATIONS.UPDATE.operationId,
    description: ADJUSTMENT_API_OPERATIONS.UPDATE.description,
  })
  @ApiParam({ name: 'id', description: 'Adjustment ID' })
  async updateAdjustment(
    @Param('id') id: string,
    @Body() dto: UpdateAdjustmentDto,
  ) {
    return await this.adjustmentService.updateAdjustment(id, dto);
  }

  @Delete(':id')
  @CatchEntityErrors()
  @ApiOperation({
    summary: 'Delete adjustment',
    operationId: ADJUSTMENT_API_OPERATIONS.DELETE.operationId,
    description: ADJUSTMENT_API_OPERATIONS.DELETE.description,
  })
  @ApiParam({ name: 'id', description: 'Adjustment ID' })
  async deleteAdjustment(
    @Param('id') id: string,
    @User() user: AuthUserObject,
  ) {
    return await this.adjustmentService.deleteAdjustment(id, user.orgId!);
  }
}
