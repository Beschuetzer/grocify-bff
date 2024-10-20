
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectsCommand, paginateListObjectsV2 } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { EMPTY_STRING } from '../constants';

class S3ClientWrapper {
  private readonly _client: S3Client;
  private readonly _s3BucketName = 'grocify';
  private readonly _s3BucketRegion = 'us-east-1';
  private readonly _s3KeyId = process.env.s3KeyId;
  private readonly _s3KeySecret = process.env.s3KeySecret;

  constructor(region?: string, keyId?: string, keySecret?: string) {
    this._client = new S3Client({
      region: region || this._s3BucketRegion,
      credentials: {
        accessKeyId: keyId || this._s3KeyId!,
        secretAccessKey: keySecret || this._s3KeySecret!,
      },
    });
  }

  get name() {
    return this._s3BucketName;
  }

  get region() {
    return this._s3BucketRegion;
  }

  /**
   *Use this to create a pre-signed url for uploading
   **/
  public createPresignedUrlForUpload(fileName: string, bucketName?: string) {
    const command = new PutObjectCommand({
      Bucket: bucketName || this._s3BucketName,
      Key: fileName,
    });
    return getSignedUrl(this._client, command, { expiresIn: 3600 });
  }

  /**
   *Use this to create a pre-signed url for downloading
   **/
  public createPresignedUrlForDownload(fileName: string, bucketName?: string) {
    const command = new GetObjectCommand({
      Bucket: bucketName || this._s3BucketName,
      Key: fileName,
    });
    return getSignedUrl(this._client, command, { expiresIn: 3600 });
  }

  /**
   *Use this to delete all the objects for a userId
   **/
  public async deleteObj(paths?: string[]) {
    try {
      if (!paths || paths.length === 0) return;
      const pathsToDelete = paths.map(path => ({Key: path}));
      const deleteCommand = new DeleteObjectsCommand({
        Bucket: this._s3BucketName,
        Delete: { Objects: pathsToDelete },
      });

      await this._client.send(deleteCommand);
    } catch (caught) {
      if (caught instanceof Error) {
        console.error(
          `Failed to remove object at '${paths}'. ${caught.name}: ${caught.message}`
        );
      }
    }
  }

  public async deleteUserObjs(userId: string) {
    try {
      const paginator = paginateListObjectsV2(
        { client: this._client },
        {
          Bucket: this._s3BucketName,
          Prefix: userId,
        }
      );

      const objectKeys = [];
      for await (const { Contents: contents } of paginator) {
        if (!contents) continue;
        objectKeys.push(
          ...contents.map((obj) => {
            if (!obj.Key?.match(new RegExp(`^${userId}/`))) {
              return { Key: EMPTY_STRING };
            }
            return { Key: obj.Key };
          })
        );
      }

      const objectKeysToDelete = objectKeys.filter((obj) => !!obj.Key);
      const deleteCommand = new DeleteObjectsCommand({
        Bucket: this._s3BucketName,
        Delete: { Objects: objectKeysToDelete },
      });

      await this._client.send(deleteCommand);
    } catch (caught) {
      if (caught instanceof Error) {
        console.error(
          `Failed to remove objects for ${userId}. ${caught.name}: ${caught.message}`
        );
      }
    }
  }
}

export const S3_CLIENT_WRAPPER = new S3ClientWrapper();
