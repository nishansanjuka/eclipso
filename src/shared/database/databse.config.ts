import { loadConfig } from '../config';

export interface DatabaseConfig {
  url: string;
}

const databaseConfig = (): DatabaseConfig => ({
  url: loadConfig().DATABASE_URL,
});

export default databaseConfig;
