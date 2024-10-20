import express from 'express';
import { S3_CLIENT_WRAPPER } from '../services/S3ClientWrapper';
import { getAndThenCacheUser, handleError } from '../helpers';
import { S3_PATH } from './constants';
import { checkIsAuthorized } from '../middlware/isAuthenticated';

const router = express.Router({
  mergeParams: true,
});

router.post(`${S3_PATH}/signedUrlForDownload`, async (req, res) => {
  try {
    const { userId, password } = req.body || {};
    const user = await getAndThenCacheUser(userId);
    await checkIsAuthorized(password, user?.password);
    const url = await S3_CLIENT_WRAPPER.createPresignedUrlForDownload();
    console.log({ url });
    res.send({url});
  } catch (error) {
    handleError(res, error);
  }
});

router.post(`${S3_PATH}/signedUrlForUpload`, async (req, res) => {
  try {
    const { userId, password } = req.body || {};
    const user = await getAndThenCacheUser(userId);
    await checkIsAuthorized(password, user?.password);
    const url = await S3_CLIENT_WRAPPER.createPresignedUrlForUpload();
    console.log({ url });
    res.send({url});
  } catch (error) {
    handleError(res, error);
  }
});

export default router;
