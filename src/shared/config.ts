import z from 'zod';
import databaseConfig, { DatabaseConfig } from './database/databse.config';
export interface Configuration {
  database: DatabaseConfig;
}

export const configuration = (): Configuration => ({
  database: databaseConfig(),
});

export const configSchema = z.object({
  DATABASE_URL: z.string(),
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
