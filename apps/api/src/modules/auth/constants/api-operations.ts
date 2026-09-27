export const AUTH_API_OPERATIONS = {
  GET_ME: {
    operationId: 'getMyAccess',
    description:
      'Returns the authenticated user, the business the request is scoped to (X-Business-Id header, or the only business the user belongs to), their role and the permissions they hold there. Permissions are read from the database, not from the session token.',
  },
  LIST_MY_BUSINESSES: {
    operationId: 'listMyBusinesses',
    description:
      'Lists every business the authenticated user belongs to, with their role in each. Use the returned orgId as the X-Business-Id header on other requests.',
  },
  CREATE_BUSINESS: {
    operationId: 'createBusiness',
    description:
      'Creates a new business. The authenticated user becomes its owner.',
  },
  GET_BUSINESS: {
    operationId: 'getBusiness',
    description:
      'Returns the profile and tax settings of the current business (any member).',
  },
  SLUG_AVAILABILITY: {
    operationId: 'checkWorkspaceAddress',
    description:
      'Tells whether a workspace address (the subdomain) is valid and free.',
  },
  UPDATE_BUSINESS: {
    operationId: 'updateBusiness',
    description:
      'Updates the profile, workspace address and tax settings of the current business, and can mark onboarding as finished. Requires business:manage.',
  },
  PRESIGN_LOGO_UPLOAD: {
    operationId: 'presignLogoUpload',
    description:
      'Returns a short-lived S3 URL the browser can upload the business logo to directly, and the public URL it will be served from once uploaded. Requires business:manage.',
  },
  DELETE_BUSINESS: {
    operationId: 'deleteBusiness',
    description:
      'Permanently deletes the current business with its roles and memberships. Irreversible. Requires business:delete (owners only).',
  },
  LIST_PERMISSIONS: {
    operationId: 'listPermissions',
    description:
      'Lists the permission catalog that roles can be composed from. Requires role:read.',
  },
  LIST_ROLES: {
    operationId: 'listRoles',
    description:
      'Lists built-in roles and the current business custom roles with their permissions. Requires role:read.',
  },
  CREATE_ROLE: {
    operationId: 'createRole',
    description:
      'Creates a custom role for the current business. You can only include permissions you hold yourself. Requires role:manage.',
  },
  UPDATE_ROLE: {
    operationId: 'updateRole',
    description:
      'Edits a custom role. Built-in roles cannot be modified, and you can only grant permissions you hold. Requires role:manage.',
  },
  DELETE_ROLE: {
    operationId: 'deleteRole',
    description:
      'Deletes a custom role that no member is using. Requires role:manage.',
  },
  LIST_MEMBERS: {
    operationId: 'listMembers',
    description:
      'Lists members of the current business with their roles. Requires member:read.',
  },
  ASSIGN_ROLE: {
    operationId: 'assignMemberRole',
    description:
      'Changes a member role. You cannot grant permissions you do not hold, change a member who outranks you, or remove the last owner. Requires role:assign.',
  },
  SET_MEMBER_BRANCHES: {
    operationId: 'setMemberBranches',
    description:
      'Limits a member to specific branches (an empty list lets them work in every branch). If you are limited yourself you can only manage members within your own branches. Requires member:manage.',
  },
  REMOVE_MEMBER: {
    operationId: 'removeMember',
    description:
      'Removes a member from the current business. You cannot remove a member who outranks you or the last owner. Requires member:manage.',
  },
  BAN_MEMBER: {
    operationId: 'banMember',
    description:
      'Bans a member from this business only (a custom, per-business ban, not a Clerk account ban). An owner can never be banned. Requires member:manage.',
  },
  UNBAN_MEMBER: {
    operationId: 'unbanMember',
    description: 'Lifts a ban on a member of this business. Requires member:manage.',
  },
  LIST_ROLE_PERMISSION_REQUESTS: {
    operationId: 'listRolePermissionRequests',
    description:
      'Lists pending requests to add protected permissions to a custom role. Requires manage:protective-permissions.',
  },
  REVIEW_ROLE_PERMISSION_REQUEST: {
    operationId: 'reviewRolePermissionRequest',
    description:
      'Approves or rejects a pending protected-permission request. Requires manage:protective-permissions.',
  },
  SET_PERMISSION_PROTECTED: {
    operationId: 'setPermissionProtected',
    description:
      'Marks a permission as protected or unprotected. Adding a protected permission to a role needs approval unless the actor holds manage:protective-permissions. Requires manage:protective-permissions.',
  },
} as const;
