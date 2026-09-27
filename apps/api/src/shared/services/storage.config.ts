import { loadConfig } from '../config';

export interface StorageConfig {
  region: string | undefined;
  accessKeyId: string | undefined;
  secretAccessKey: string | undefined;
  bucket: string | undefined;
  publicUrl: string | undefined;
}

const storageConfig = (): StorageConfig => ({
  region: loadConfig().AWS_REGION,
  accessKeyId: loadConfig().AWS_ACCESS_KEY_ID,
  secretAccessKey: loadConfig().AWS_SECRET_ACCESS_KEY,
  bucket: loadConfig().AWS_S3_BUCKET,
  publicUrl: loadConfig().AWS_S3_PUBLIC_URL,
});

export default storageConfig;
