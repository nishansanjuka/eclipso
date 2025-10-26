import authConfig from '../../modules/auth/auth.config';

export function mapEmailsToInvitations(
  emails: string[],
  role: string,
  inviterUserId: string,
) {
  return emails.map((email) => ({
    inviterUserId,
    emailAddress: email,
    role,
    redirectUrl: authConfig().org_invite_redirect_url,
  }));
}
