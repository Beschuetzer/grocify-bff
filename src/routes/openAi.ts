import express from 'express';
import { OPEN_AI_CLIENT_WRAPPER } from '../services/OpenAiClientWrapper';
import { getAndThenCacheUser, handleError } from '../helpers';
import { OPEN_AI_PATH } from './constants';
import { checkIsAuthorized } from '../middlware/isAuthenticated';

const router = express.Router({
  mergeParams: true,
});

router.get(`${OPEN_AI_PATH}/processGroceryList`, async (req, res) => {
    try {
        const { image, userId, password } = req.body
        const user = await getAndThenCacheUser(userId);
        await checkIsAuthorized(password, user?.password);
        const response = await OPEN_AI_CLIENT_WRAPPER.processGroceryList(image);
        res.send(response)
    } catch (error) {
        handleError(res, error);
    }
});

export default router;