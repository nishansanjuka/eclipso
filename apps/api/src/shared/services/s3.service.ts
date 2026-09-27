import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { ConfigService } from './config.service';

@Injectable()
export class S3Service {
  constructor(private readonly config: ConfigService) {}

  private client(): { s3: S3Client; bucket: string; publicUrl: string } {
    const { region, accessKeyId, secretAccessKey, bucket, publicUrl } =
      this.config.get('storage');
    if (!region || !accessKeyId || !secretAccessKey || !bucket) {
      throw new ServiceUnavailableException(
        'Image uploads are not configured (missing AWS_REGION / AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY / AWS_S3_BUCKET).',
      );
    }
    return {
      s3: new S3Client({
        region,
        credentials: { accessKeyId, secretAccessKey },
      }),
      bucket,
      publicUrl: publicUrl || `https://${bucket}.s3.${region}.amazonaws.com`,
    };
  }

  /**
   * A short-lived URL the browser can `PUT` a single object to directly,
   * so the file never passes through our server. The key is chosen here,
   * never by the caller, so nobody can overwrite another business's object.
   */
  async presignUpload(
    key: string,
    contentType: string,
  ): Promise<{ uploadUrl: string; publicUrl: string }> {
    const { s3, bucket, publicUrl } = this.client();
    const uploadUrl = await getSignedUrl(
      s3,
      new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: contentType }),
      { expiresIn: 300 },
    );
    return { uploadUrl, publicUrl: `${publicUrl}/${key}` };
  }
}
