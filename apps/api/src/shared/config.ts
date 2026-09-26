import z from 'zod';
import databaseConfig, { DatabaseConfig } from './database/databse.config';
import authConfig, { AuthConfig } from '../modules/auth/auth.config';
export interface Configuration {
  database: DatabaseConfig;
  auth: AuthConfig;
}

export const configuration = (): Configuration => ({
  database: databaseConfig(),
  auth: authConfig(),
});

export const configSchema = z.object({
  DATABASE_URL: z.string(),
  CLERK_PUBLISHABLE_KEY: z.string(),
  CLERK_SECRET_KEY: z.string(),
  CLERK_WEBHOOK_SIGNING_SECRET: z.string(),
  /** Server-side membership cache TTL; 0 disables caching. */
  ACCESS_CACHE_TTL_MS: z.coerce.number().int().min(0).default(30_000),
  /** resend.com API key. Without it, emails are logged instead of sent (dev). */
  RESEND_API_KEY: z.string().optional(),
  /** Sender shown on emails; must be on a domain verified in Resend. */
  MAIL_FROM: z.string().default('Aperture <invites@localhost>'),
  /** Root domain of the web app; workspaces live at `<slug>.<root>`. */
  WEB_ROOT_DOMAIN: z.string().default('localhost:3001'),
  WEB_PROTOCOL: z.enum(['http', 'https']).default('http'),
  /** How long an invitation link works. */
  INVITATION_TTL_DAYS: z.coerce.number().int().min(1).max(30).default(7),
});

export type EnvConfig = z.infer<typeof configSchema>;

export const loadConfig = (): EnvConfig => {
  const parsed = configSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error(parsed.error.format());
    throw new Error('❌ Invalid environment variables');
  }
  return parsed.data;
};
