import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam } from '@nestjs/swagger';
import { type AuthUserObject } from '../../../../globals';
import { User } from '../../../shared/decorators/auth.decorator';
import { RequirePermissions } from '../../../shared/decorators/require-permissions.decorator';
import { parseBody } from '../../auth/dto/auth.dto';
import { PermissionType } from '../../auth/enums/auth-permissions.enum';
import { BranchUseCase } from '../application/branch.use-case';
import {
  CreateBranchDto,
  UpdateBranchDto,
  createBranchSchema,
  updateBranchSchema,
} from '../dto/branch.dto';

@Controller('branches')
export class BranchController {
  constructor(private readonly useCase: BranchUseCase) {}

  @ApiOperation({
    operationId: 'listBranches',
    description:
      'Branches of the current business (only your own if you are limited to specific branches).',
  })
  @RequirePermissions(PermissionType.BRANCH_READ)
  @Get()
  list(@User() user: AuthUserObject) {
    return this.useCase.list(user);
  }

  @ApiOperation({
    operationId: 'createBranch',
    description: 'Adds a branch (location) to the current business.',
  })
  @ApiBody({ type: CreateBranchDto })
  @RequirePermissions(PermissionType.BRANCH_MANAGE)
  @Post()
  create(@User() user: AuthUserObject, @Body() body: unknown) {
    return this.useCase.create(user, parseBody(createBranchSchema, body));
  }

  @ApiOperation({
    operationId: 'updateBranch',
    description:
      'Renames, deactivates or re-defaults a branch. Branches are never deleted: their history is kept.',
  })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ type: UpdateBranchDto })
  @RequirePermissions(PermissionType.BRANCH_MANAGE)
  @Put(':id')
  update(
    @User() user: AuthUserObject,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: unknown,
  ) {
    return this.useCase.update(user, id, parseBody(updateBranchSchema, body));
  }
}
