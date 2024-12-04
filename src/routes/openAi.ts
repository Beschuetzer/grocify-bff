import express from 'express';
import { OPEN_AI_CLIENT_WRAPPER } from '../services/OpenAiClientWrapper';
import { getAndThenCacheUser, handleError } from '../helpers';
import { OPEN_AI_PATH } from './constants';
import { checkIsAuthorized } from '../middlware/isAuthenticated';

const router = express.Router({
  mergeParams: true,
});

router.post(`${OPEN_AI_PATH}/processGroceryList`, async (req, res) => {
    try {
        const { image, userId, password } = req.body
        console.log({image: typeof image === 'string' ? `${image.substring(0,5)}...${image.substring(image.length -5)}` : "", userId, password});
        
        const user = await getAndThenCacheUser(userId);
        await checkIsAuthorized(password, user?.password);
        const response = await OPEN_AI_CLIENT_WRAPPER.processGroceryList(image);
        console.log({response});
        res.send(response)
    } catch (error) {
        handleError(res, error);
    }
});

export default router;