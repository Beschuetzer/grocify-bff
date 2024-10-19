import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

class S3ClientWrapper {
    private readonly _client: S3Client;
    private readonly _s3BucketName = 'grocify'
    private readonly _s3BucketRegion = 'us-east-2'
    private readonly _s3KeyId = process.env.s3KeyId;
    private readonly _s3KeySecret = process.env.s3KeySecret;

    constructor(region?: string, keyId?: string, keySecret?: string) {
        this._client = new S3Client({ region: region || this._s3BucketRegion, credentials: {
            accessKeyId: keyId || this._s3KeyId!,
            secretAccessKey: keySecret || this._s3KeySecret!,
        } })
    }

    /**
    *Use this to create a pre-signed url for uploading
    **/
    public createPresignedUrlForUpload (bucketName?: string, key?: string) {
        const command = new PutObjectCommand({ Bucket: bucketName || this._s3BucketName, Key: key || this._s3KeyId });
        return getSignedUrl(this._client, command, { expiresIn: 3600 });
    };

    /**
    *Use this to create a pre-signed url for uploading
    **/
    public createPresignedUrlForDownload (bucketName?: string, key?: string) {
        const command = new GetObjectCommand({ Bucket: bucketName || this._s3BucketName, Key: key || this._s3KeyId });
        return getSignedUrl(this._client, command, { expiresIn: 3600 });
    };
}

export const S3_CLIENT_WRAPPER = new S3ClientWrapper();