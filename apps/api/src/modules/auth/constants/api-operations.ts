export const AUTH_API_OPERATIONS = {
  CREATE_ORGANIZATION: {
    operationId: 'createOrganization',
    description:
      'Creates a new organization in the system with the provided name and business type. The authenticated user will become the owner/administrator of the newly created organization and will be automatically associated with it.',
  },
  UPDATE_ORGANIZATION: {
    operationId: 'updateOrganization',
    description:
      "Updates the organization information including name and business type. Only users with appropriate permissions within the organization can perform this operation. Changes apply to the user's current organization.",
  },
  DELETE_ORGANIZATION: {
    operationId: 'deleteOrganization',
    description:
      'Permanently deletes the organization and all associated data from the system. This operation removes all users, invitations, and organization-specific data. This action is irreversible and requires appropriate administrative permissions.',
  },
  INVITE_USER: {
    operationId: 'inviteUserToOrganization',
    description:
      'Sends invitation emails to one or more users to join the organization with a specified role. The invited users will receive an email with instructions to accept the invitation and join the organization. Only existing organization members with appropriate permissions can send invitations.',
  },
  RESEND_INVITATION: {
    operationId: 'resendInvitationToUser',
    description:
      'Resends an existing invitation email to a user who was previously invited to join the organization. This is useful when the original invitation email was not received or has expired. The invitation must already exist for the specified email address.',
  },
  REVOKE_INVITATION: {
    operationId: 'revokeInviteToUser',
    description:
      'Cancels a pending invitation to join the organization by invitation ID. Once revoked, the invitation link becomes invalid and the invited user will no longer be able to accept the invitation. Only users with appropriate permissions can revoke invitations.',
  },
  REMOVE_USER: {
    operationId: 'deleteUserFromOrganization',
    description:
      "Removes a user from the organization by user ID. This operation will revoke the user's access to all organization resources and data. The removed user will no longer be able to access organization-specific content. Administrative permissions are required for this operation.",
  },
} as const;
