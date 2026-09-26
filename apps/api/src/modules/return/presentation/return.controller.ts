import { RequirePermissions } from '../../../shared/decorators/require-permissions.decorator';
import { PermissionType } from '../../auth/enums/auth-permissions.enum';
import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
} from '@nestjs/common';
import { User } from '../../../shared/decorators/auth.decorator';
import { type AuthUserObject } from '../../../../globals';
import { ReturnCreateUseCase } from '../application/return-create.usecase';
import { CreateReturnDto } from '../dto/return.dto';
import { CatchEntityErrors } from '../../../shared/decorators/exception.catcher';
import { ApiBody, ApiOperation, ApiParam } from '@nestjs/swagger';
import { RETURN_API_OPERATIONS } from '../constants/api-operations';
import { ReturnService } from '../infrastructure/return.service';

@Controller('returns')
export class ReturnController {
  constructor(
    private readonly returnCreateUseCase: ReturnCreateUseCase,
    private readonly returnService: ReturnService,
  ) {}

  @ApiOperation({
    operationId: RETURN_API_OPERATIONS.CREATE.operationId,
    description: RETURN_API_OPERATIONS.CREATE.description,
  })
  @ApiBody({ type: CreateReturnDto })
  @RequirePermissions(PermissionType.RETURN_CREATE)
  @Post('create')
  @CatchEntityErrors()
  createReturn(
    @Body() returnData: CreateReturnDto,
    @User() user: AuthUserObject,
  ) {
    return this.returnCreateUseCase.execute(
      user.businessId!,
      user.userId,
      returnData,
      user,
    );
  }

  @ApiOperation({
    operationId: RETURN_API_OPERATIONS.GET.operationId,
    description: RETURN_API_OPERATIONS.GET.description,
  })
  @ApiParam({ name: 'id', type: 'string', description: 'Return ID' })
  @RequirePermissions(PermissionType.RETURN_READ)
  @Get(':id')
  @CatchEntityErrors()
  async getReturn(@Param('id') id: string, @User() user: AuthUserObject) {
    const result = await this.returnService.getReturnById(
      id,
      user.businessId!,
      user,
    );
    if (!result) throw new NotFoundException('Return not found');
    return result;
  }
}
