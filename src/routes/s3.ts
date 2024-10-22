import express from 'express';
import { S3_CLIENT_WRAPPER } from '../services/S3ClientWrapper';
import { getAndThenCacheUser, handleError } from '../helpers';
import { S3_PATH } from './constants';
import { checkIsAuthorized } from '../middlware/isAuthenticated';

const router = express.Router({
  mergeParams: true,
});

router.post(`${S3_PATH}/signedUrl`, async (req, res) => {
  try {
    const { userId, password, filename } = req.body || {};
    console.log({userId, password, filename});
    
    const user = await getAndThenCacheUser(userId);
    await checkIsAuthorized(password, user?.password);
    const uploadUrl = await S3_CLIENT_WRAPPER.createPresignedUrlForUpload(`${userId}/${filename}`);
    const downloadUrl = getPublicS3Url({
        userId,
        bucketName: S3_CLIENT_WRAPPER.name,
        region: S3_CLIENT_WRAPPER.region,
        filename,
    })
    res.send({ downloadUrl, uploadUrl });
  } catch (error) {
    handleError(res, error);
  }
});

export type GetPublicS3UrlInput = {
    userId: string;
    filename: string;
    bucketName: string;
    region: string;
  }
  
  export function getPublicS3Url(input: GetPublicS3UrlInput) {
    const { userId, filename, bucketName, region } = input;
    return `https://${bucketName}.s3.${region}.amazonaws.com/${userId}/${filename}`;
  }

export default router;
