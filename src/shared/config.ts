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
