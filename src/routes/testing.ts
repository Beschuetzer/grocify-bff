import express from 'express';
import {
  getRandomInt,
  handleError,
  hashPassword,
  comparePasswords,
} from '../helpers';
import { ItemSchema } from '../schema';
import { S3_CLIENT_WRAPPER } from '../services/S3ClientWrapper';

const router = express.Router({
  mergeParams: true,
});

router.get('/mockCreation', async (req, res) => {
  const createdItem = new ItemSchema({
    addedDate: Date.now() - getRandomInt(1000000, 1000000000),
    frequency: getRandomInt(1, 10),
    unit: 'day',
    name: 'test item',
    upc: getRandomInt(1, 999999999999).toString().padStart(12, '0'),
    images: ['www.test.com'],
    imageToUseIndex: 0,
    fullscreenImage: 'www.test.com',
    lastUpdatedDate: Date.now(),
  });

  try {
    await createdItem.save();
    res.send({ createdItem });
  } catch (error) {
    handleError(res, error);
  }
});

router.get('/s3/urlForDownload', async (req, res) => {
  const url = await S3_CLIENT_WRAPPER.createPresignedUrlForDownload();
  console.log({url});
  res.send(url);
});

router.get('/s3/urlForUpload', async (req, res) => {
  const url = await S3_CLIENT_WRAPPER.createPresignedUrlForUpload();
  console.log({url});
  res.send(url);
});

router.post('/password', async (req, res) => {
  const { username, password } = req.body;
  console.log({ username, password });
  const start = performance.now();
  hashPassword(password, function (err, hash) {
    const end = performance.now();
    const diff = end - start;
    if (err) {
      res.status(500).send({ err });
      return;
    }

    console.log({ diff, hash });
    res.send({ diff, hash });
  });
});

router.post('/passwordCompare', async (req, res) => {
  const { hash, password } = req.body;
  console.log({ hash, password });
  const start = performance.now();
  comparePasswords(password, hash, function (err, result) {
    const end = performance.now();
    const diff = end - start;
    if (err) {
      res.status(500).send({ err });
      return;
    }

    console.log({ diff, result });
    res.send({ diff, result });
  });
});

router.get('/compareObjectCheck/:numProps', async (req, res) => {
  const { numProps } = req.params;
  console.log({ numProps });

  // Create a large object
  const largeObject = createLargeObject(numProps);

  // Benchmark Object.keys()
  const keyStart = performance.now();
  Object.keys(largeObject);
  const keyEnd = performance.now();

  res.send({
    keyApproach: keyEnd - keyStart,
  });
});

export default router;

function createLargeObject(numProps: string) {
  const obj = {} as any;
  for (let i = 0; i < Number(numProps); i++) {
    obj[`key${i}`] = i;
  }
  return obj;
}
