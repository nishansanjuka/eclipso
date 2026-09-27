import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
} from '@nestjs/common';
import {
  ApiBody,
  ApiHeader,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { AccessManagementUseCase } from '../application/access-management.use-case';
import {
  AssignRoleDto,
  assignRoleSchema,
  BanMemberDto,
  banMemberSchema,
  CreateBusinessDto,
  createBusinessSchema,
  CreateRoleDto,
  createRoleSchema,
  parseBody,
  PresignLogoUploadDto,
  presignLogoUploadSchema,
  SetPermissionProtectedDto,
  setPermissionProtectedSchema,
  UpdateBusinessDto,
  updateBusinessSchema,
  UpdateRoleDto,
  updateRoleSchema,
} from '../dto/auth.dto';
import { User } from '../../../shared/decorators/auth.decorator';
import { type AuthUserObject } from '../../../../globals';
import {
  AllowWithoutBusiness,
  RequirePermissions,
} from '../../../shared/decorators/require-permissions.decorator';
import { PermissionType } from '../enums/auth-permissions.enum';
import { AUTH_API_OPERATIONS } from '../constants/api-operations';
import {
  SetMemberBranchesDto,
  setMemberBranchesSchema,
} from '../../branch/dto/branch.dto';

@ApiTags('Access')
@ApiHeader({
  name: 'X-Business-Id',
  required: false,
  description:
    'Business to act in. Optional when the user belongs to exactly one business.',
})
@Controller('/auth')
export class AuthController {
  constructor(private readonly useCase: AccessManagementUseCase) {}

  // ── identity & businesses (no business context required) ─────────────────

  @ApiOperation({
    operationId: AUTH_API_OPERATIONS.GET_ME.operationId,
    description: AUTH_API_OPERATIONS.GET_ME.description,
  })
  @AllowWithoutBusiness()
  @Get('me')
  getMe(@User() user: AuthUserObject) {
    return {
      userId: user.userId,
      orgId: user.orgId ?? null,
      roleKey: user.roleKey ?? null,
      permissions: user.permissions,
      branchId: user.branchId ?? null,
      restrictedBranchIds: user.restrictedBranchIds,
    };
  }

  @ApiOperation({
    operationId: AUTH_API_OPERATIONS.LIST_MY_BUSINESSES.operationId,
    description: AUTH_API_OPERATIONS.LIST_MY_BUSINESSES.description,
  })
  @AllowWithoutBusiness()
  @Get('businesses')
  listMyBusinesses(@User() user: AuthUserObject) {
    return this.useCase.listMyBusinesses(user);
  }

  @ApiOperation({
    operationId: AUTH_API_OPERATIONS.CREATE_BUSINESS.operationId,
    description: AUTH_API_OPERATIONS.CREATE_BUSINESS.description,
  })
  @ApiBody({ type: CreateBusinessDto })
  @AllowWithoutBusiness()
  @Post('businesses')
  createBusiness(@User() user: AuthUserObject, @Body() body: unknown) {
    return this.useCase.createBusiness(
      user,
      parseBody(createBusinessSchema, body),
    );
  }

  // ── current business ──────────────────────────────────────────────────────

  @ApiOperation({
    operationId: AUTH_API_OPERATIONS.GET_BUSINESS.operationId,
    description: AUTH_API_OPERATIONS.GET_BUSINESS.description,
  })
  @Get('business')
  getBusiness(@User() user: AuthUserObject) {
    return this.useCase.getBusiness(user);
  }

  @ApiOperation({
    operationId: AUTH_API_OPERATIONS.SLUG_AVAILABILITY.operationId,
    description: AUTH_API_OPERATIONS.SLUG_AVAILABILITY.description,
  })
  @ApiParam({ name: 'slug', type: String })
  @AllowWithoutBusiness()
  @Get('slugs/:slug')
  slugAvailability(@Param('slug') slug: string) {
    return this.useCase.slugAvailability(slug);
  }

  @ApiOperation({
    operationId: AUTH_API_OPERATIONS.UPDATE_BUSINESS.operationId,
    description: AUTH_API_OPERATIONS.UPDATE_BUSINESS.description,
  })
  @ApiBody({ type: UpdateBusinessDto })
  @RequirePermissions(PermissionType.BUSINESS_MANAGE)
  @Put('business')
  updateBusiness(@User() user: AuthUserObject, @Body() body: unknown) {
    return this.useCase.updateBusiness(
      user,
      parseBody(updateBusinessSchema, body),
    );
  }

  @ApiOperation({
    operationId: AUTH_API_OPERATIONS.PRESIGN_LOGO_UPLOAD.operationId,
    description: AUTH_API_OPERATIONS.PRESIGN_LOGO_UPLOAD.description,
  })
  @ApiBody({ type: PresignLogoUploadDto })
  @RequirePermissions(PermissionType.BUSINESS_MANAGE)
  @Post('business/logo/presign')
  presignLogoUpload(@User() user: AuthUserObject, @Body() body: unknown) {
    const { contentType } = parseBody(presignLogoUploadSchema, body);
    return this.useCase.presignLogoUpload(user, contentType);
  }

  @ApiOperation({
    operationId: AUTH_API_OPERATIONS.DELETE_BUSINESS.operationId,
    description: AUTH_API_OPERATIONS.DELETE_BUSINESS.description,
  })
  @RequirePermissions(PermissionType.BUSINESS_DELETE)
  @Delete('business')
  deleteBusiness(@User() user: AuthUserObject) {
    return this.useCase.deleteBusiness(user);
  }

  // ── permissions & roles ───────────────────────────────────────────────────

  @ApiOperation({
    operationId: AUTH_API_OPERATIONS.LIST_PERMISSIONS.operationId,
    description: AUTH_API_OPERATIONS.LIST_PERMISSIONS.description,
  })
  @RequirePermissions(PermissionType.ROLE_READ)
  @Get('permissions')
  listPermissions(@User() user: AuthUserObject) {
    return this.useCase.listPermissionCatalog(user);
  }

  @ApiOperation({
    operationId: AUTH_API_OPERATIONS.SET_PERMISSION_PROTECTED.operationId,
    description: AUTH_API_OPERATIONS.SET_PERMISSION_PROTECTED.description,
  })
  @ApiParam({ name: 'permissionId', type: String })
  @ApiBody({ type: SetPermissionProtectedDto })
  @RequirePermissions(PermissionType.MANAGE_PROTECTIVE_PERMISSIONS)
  @Patch('permissions/:permissionId/protect')
  setPermissionProtected(
    @User() user: AuthUserObject,
    @Param('permissionId', ParseUUIDPipe) permissionId: string,
    @Body() body: unknown,
  ) {
    const { protected: protectedFlag } = parseBody(
      setPermissionProtectedSchema,
      body,
    );
    return this.useCase.setPermissionProtected(
      user,
      permissionId,
      protectedFlag,
    );
  }

  @ApiOperation({
    operationId:
      AUTH_API_OPERATIONS.LIST_ROLE_PERMISSION_REQUESTS.operationId,
    description: AUTH_API_OPERATIONS.LIST_ROLE_PERMISSION_REQUESTS.description,
  })
  @RequirePermissions(PermissionType.MANAGE_PROTECTIVE_PERMISSIONS)
  @Get('role-permission-requests')
  listRolePermissionRequests(@User() user: AuthUserObject) {
    return this.useCase.listPendingRequests(user);
  }

  @ApiOperation({
    operationId:
      AUTH_API_OPERATIONS.REVIEW_ROLE_PERMISSION_REQUEST.operationId,
    description:
      AUTH_API_OPERATIONS.REVIEW_ROLE_PERMISSION_REQUEST.description,
  })
  @ApiParam({ name: 'requestId', type: String })
  @RequirePermissions(PermissionType.MANAGE_PROTECTIVE_PERMISSIONS)
  @Post('role-permission-requests/:requestId/approve')
  approveRolePermissionRequest(
    @User() user: AuthUserObject,
    @Param('requestId', ParseUUIDPipe) requestId: string,
  ) {
    return this.useCase.reviewPermissionRequest(user, requestId, true);
  }

  @ApiOperation({
    operationId:
      AUTH_API_OPERATIONS.REVIEW_ROLE_PERMISSION_REQUEST.operationId,
    description:
      AUTH_API_OPERATIONS.REVIEW_ROLE_PERMISSION_REQUEST.description,
  })
  @ApiParam({ name: 'requestId', type: String })
  @RequirePermissions(PermissionType.MANAGE_PROTECTIVE_PERMISSIONS)
  @Post('role-permission-requests/:requestId/reject')
  rejectRolePermissionRequest(
    @User() user: AuthUserObject,
    @Param('requestId', ParseUUIDPipe) requestId: string,
  ) {
    return this.useCase.reviewPermissionRequest(user, requestId, false);
  }

  @ApiOperation({
    operationId: AUTH_API_OPERATIONS.LIST_ROLES.operationId,
    description: AUTH_API_OPERATIONS.LIST_ROLES.description,
  })
  @RequirePermissions(PermissionType.ROLE_READ)
  @Get('roles')
  listRoles(@User() user: AuthUserObject) {
    return this.useCase.listRoles(user);
  }

  @ApiOperation({
    operationId: AUTH_API_OPERATIONS.CREATE_ROLE.operationId,
    description: AUTH_API_OPERATIONS.CREATE_ROLE.description,
  })
  @ApiBody({ type: CreateRoleDto })
  @RequirePermissions(PermissionType.ROLE_MANAGE)
  @Post('roles')
  createRole(@User() user: AuthUserObject, @Body() body: unknown) {
    return this.useCase.createRole(user, parseBody(createRoleSchema, body));
  }

  @ApiOperation({
    operationId: AUTH_API_OPERATIONS.UPDATE_ROLE.operationId,
    description: AUTH_API_OPERATIONS.UPDATE_ROLE.description,
  })
  @ApiParam({ name: 'roleId', type: String })
  @ApiBody({ type: UpdateRoleDto })
  @RequirePermissions(PermissionType.ROLE_MANAGE)
  @Put('roles/:roleId')
  updateRole(
    @User() user: AuthUserObject,
    @Param('roleId', ParseUUIDPipe) roleId: string,
    @Body() body: unknown,
  ) {
    return this.useCase.updateRole(
      user,
      roleId,
      parseBody(updateRoleSchema, body),
    );
  }

  @ApiOperation({
    operationId: AUTH_API_OPERATIONS.DELETE_ROLE.operationId,
    description: AUTH_API_OPERATIONS.DELETE_ROLE.description,
  })
  @ApiParam({ name: 'roleId', type: String })
  @RequirePermissions(PermissionType.ROLE_MANAGE)
  @Delete('roles/:roleId')
  deleteRole(
    @User() user: AuthUserObject,
    @Param('roleId', ParseUUIDPipe) roleId: string,
  ) {
    return this.useCase.deleteRole(user, roleId);
  }

  // ── members ───────────────────────────────────────────────────────────────

  @ApiOperation({
    operationId: AUTH_API_OPERATIONS.LIST_MEMBERS.operationId,
    description: AUTH_API_OPERATIONS.LIST_MEMBERS.description,
  })
  @RequirePermissions(PermissionType.MEMBER_READ)
  @Get('members')
  listMembers(@User() user: AuthUserObject) {
    return this.useCase.listMembers(user);
  }

  @ApiOperation({
    operationId: AUTH_API_OPERATIONS.ASSIGN_ROLE.operationId,
    description: AUTH_API_OPERATIONS.ASSIGN_ROLE.description,
  })
  @ApiParam({ name: 'userId', type: String })
  @ApiBody({ type: AssignRoleDto })
  @RequirePermissions(PermissionType.ROLE_ASSIGN)
  @Patch('members/:userId/role')
  assignRole(
    @User() user: AuthUserObject,
    @Param('userId') userId: string,
    @Body() body: unknown,
  ) {
    const { roleId } = parseBody(assignRoleSchema, body);
    return this.useCase.assignRole(user, userId, roleId);
  }

  @ApiOperation({
    operationId: AUTH_API_OPERATIONS.SET_MEMBER_BRANCHES.operationId,
    description: AUTH_API_OPERATIONS.SET_MEMBER_BRANCHES.description,
  })
  @ApiParam({ name: 'userId', type: String })
  @ApiBody({ type: SetMemberBranchesDto })
  @RequirePermissions(PermissionType.MEMBER_MANAGE)
  @Put('members/:userId/branches')
  setMemberBranches(
    @User() user: AuthUserObject,
    @Param('userId') userId: string,
    @Body() body: unknown,
  ) {
    const { branchIds } = parseBody(setMemberBranchesSchema, body);
    return this.useCase.setMemberBranches(user, userId, branchIds);
  }

  @ApiOperation({
    operationId: AUTH_API_OPERATIONS.REMOVE_MEMBER.operationId,
    description: AUTH_API_OPERATIONS.REMOVE_MEMBER.description,
  })
  @ApiParam({ name: 'userId', type: String })
  @RequirePermissions(PermissionType.MEMBER_MANAGE)
  @Delete('members/:userId')
  removeMember(@User() user: AuthUserObject, @Param('userId') userId: string) {
    return this.useCase.removeMember(user, userId);
  }

  @ApiOperation({
    operationId: AUTH_API_OPERATIONS.BAN_MEMBER.operationId,
    description: AUTH_API_OPERATIONS.BAN_MEMBER.description,
  })
  @ApiParam({ name: 'userId', type: String })
  @ApiBody({ type: BanMemberDto })
  @RequirePermissions(PermissionType.MEMBER_MANAGE)
  @Post('members/:userId/ban')
  banMember(
    @User() user: AuthUserObject,
    @Param('userId') userId: string,
    @Body() body: unknown,
  ) {
    const { reason } = parseBody(banMemberSchema, body);
    return this.useCase.banMember(user, userId, reason);
  }

  @ApiOperation({
    operationId: AUTH_API_OPERATIONS.UNBAN_MEMBER.operationId,
    description: AUTH_API_OPERATIONS.UNBAN_MEMBER.description,
  })
  @ApiParam({ name: 'userId', type: String })
  @RequirePermissions(PermissionType.MEMBER_MANAGE)
  @Post('members/:userId/unban')
  unbanMember(
    @User() user: AuthUserObject,
    @Param('userId') userId: string,
  ) {
    return this.useCase.unbanMember(user, userId);
  }
}
