import express from 'express';
import { S3_CLIENT_WRAPPER } from '../services/S3ClientWrapper';
import { handleError } from '../helpers';
import { S3_PATH } from './constants';

const router = express.Router({
  mergeParams: true,
});

router.get(`/${S3_PATH}/signedUrlForDownload`, async (req, res) => {
  try {
    const url = await S3_CLIENT_WRAPPER.createPresignedUrlForDownload();
    console.log({ url });
    res.send(url);
  } catch (error) {
    handleError(res, error);
  }
});

router.get(`/${S3_PATH}/signedUrlForUpload`, async (req, res) => {
  try {
    const url = await S3_CLIENT_WRAPPER.createPresignedUrlForUpload();
    console.log({ url });
    res.send(url);
  } catch (error) {
    handleError(res, error);
  }
});

export default router;
