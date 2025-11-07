import { Body, Controller, Get, Param, Post } from '@nestjs/common';
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
  @Post('create')
  @CatchEntityErrors()
  createReturn(
    @Body() returnData: CreateReturnDto,
    @User() user: AuthUserObject,
  ) {
    return this.returnCreateUseCase.execute(
      user.orgId!,
      user.userId!,
      returnData,
    );
  }

  @ApiOperation({
    operationId: RETURN_API_OPERATIONS.GET.operationId,
    description: RETURN_API_OPERATIONS.GET.description,
  })
  @ApiParam({ name: 'id', type: 'string', description: 'Return ID' })
  @Get(':id')
  @CatchEntityErrors()
  getReturn(@Param('id') id: string) {
    return this.returnService.getReturnById(id);
  }
}
