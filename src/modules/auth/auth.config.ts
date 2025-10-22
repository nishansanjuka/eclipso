import { loadConfig } from '../../shared/config';

export interface AuthConfig {
  publishable_key: string;
  secret_key: string;
}

const authConfig = (): AuthConfig => ({
  publishable_key: loadConfig().CLERK_PUBLISHABLE_KEY,
  secret_key: loadConfig().CLERK_SECRET_KEY,
});

export default authConfig;
