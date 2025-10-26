import { loadConfig } from '../../shared/config';

export interface AuthConfig {
  publishable_key: string;
  secret_key: string;
  webhook_signing_secret: string;
  org_invite_redirect_url: string;
}

const authConfig = (): AuthConfig => ({
  publishable_key: loadConfig().CLERK_PUBLISHABLE_KEY,
  secret_key: loadConfig().CLERK_SECRET_KEY,
  webhook_signing_secret: loadConfig().CLERK_WEBHOOK_SIGNING_SECRET,
  org_invite_redirect_url: loadConfig().CLERK_ORG_INVITE_REDIRECT_URL,
});

export default authConfig;
