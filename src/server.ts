import express from 'express';
import { config } from './config';
import os from 'os';
import mongoose from 'mongoose';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import itemRoutes from './routes/item';
import lastPurchasedRoutes from './routes/lastPurchasedMap';
import openAiRoutes from './routes/openAi';
import s3Routes from './routes/s3';
import storeRoutes from './routes/store';
import testRoutes from './routes/testing';
import userRoutes from './routes/user';
import inventoryRoutes from './routes/inventory';
import { getErrorMessage } from './helpers';
import { USER_PATH } from './routes/constants';

const app = express();
// app.set('trust proxy', 1);
const dbName = 'grocify';
const mongoDBPassword = process.env.mongoDBPassword;
if (!mongoDBPassword) {
  throw new Error('Missing required "mongoDBPassword" environment variable.');
}
const mongoDbURL = `mongodb+srv://admin:${mongoDBPassword}@cluster0.3trbv.mongodb.net/${dbName}?retryWrites=true&w=majority`;

mongoose
  .connect(mongoDbURL)
  .then(() => console.log(`Connected to ${dbName} collection in MongoDB!`))
  .catch(() => console.log(`Unable to connect to ${dbName} collection.`));

//express config
app.use(helmet());
app.use(express.json({ limit: '50mb' }));

app.use((req, res, next) => {
  let responseSummary: unknown = '[no body]';
  let responseBody: unknown;
  const originalSend = res.send.bind(res);
  const originalJson = res.json.bind(res);

  res.send = ((body?: unknown) => {
    responseBody = body;
    responseSummary = summarizeResponseValue(body);
    return originalSend(body);
  }) as typeof res.send;
  res.json = ((body?: unknown) => {
    responseBody = body;
    responseSummary = summarizeResponseValue(body);
    return originalJson(body);
  }) as typeof res.json;

  res.on('finish', () => {
    const logFullResponses = process.env.LOG_FULL_RESPONSES === 'true';
    console.log('[route]', {
      method: req.method,
      route: req.route?.path || 'unmatched',
      statusCode: res.statusCode,
      body: logFullResponses ? sanitizeResponseForLogging(req.body) : summarizeRequestBody(req.body),
      returned: logFullResponses ? sanitizeResponseForLogging(responseBody) : responseSummary,
    });
  });
  next();
});

// //rate limiting for auth-sensitive routes to slow down brute-force/credential-stuffing attempts
// const authRateLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000,
//   limit: 20,
//   standardHeaders: true,
//   legacyHeaders: false,
// });
// app.use(`${USER_PATH}`, authRateLimiter);

//routes
app.use(userRoutes);
app.use(itemRoutes);
app.use(inventoryRoutes);
app.use(lastPurchasedRoutes);
app.use(openAiRoutes);
app.use(s3Routes);
app.use(storeRoutes);
app.use(testRoutes);
app.use(userRoutes);

app.use((error: unknown, req: express.Request, res: express.Response, next: express.NextFunction) => {
  const errorName = error instanceof Error ? error.name : 'UnknownError';
  const errorMessage = error instanceof Error ? error.message : String(error);
  console.error('[route error]', {
    method: req.method,
    route: req.route?.path || 'unmatched',
    errorName,
    errorMessage: getSafeErrorMessage(errorMessage),
  });

  if (res.headersSent) {
    next(error);
    return;
  }
  res.status(500).send(false);
});

//catch all other routes and return a 404
app.use((req, res, next) => {
  res.status(404).json(getErrorMessage(`'${req.originalUrl}' not found`));
});

const PORT = config.server.port;

const interfaces = os.networkInterfaces();
const addresses: string[] = [];
for (const iface of Object.values(interfaces)) {
  iface?.forEach((net) => {
    if (net.family === 'IPv4' && !net.internal) {
      addresses.push(net.address);
    }
  });
}

app.listen(PORT, () => {
  console.log(`App running on port ${PORT}`);
  if (addresses.length) {
    console.log('Server available at:');
    console.log(`Listening on port ${PORT}.`);
  } else {
    console.log('No external IPv4 address found.');
  }
});

function summarizeRequestBody(body: unknown) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return summarizeRequestValue(body);
  }

  return Object.fromEntries(
    Object.entries(body).map(([key, value]) => [
      key,
      isSensitiveBodyKey(key) ? '[redacted]' : summarizeRequestValue(value),
    ])
  );
}

function summarizeRequestValue(value: unknown): unknown {
  if (typeof value === 'string') {
    return `[string: ${value.length} characters]`;
  }
  if (Array.isArray(value)) {
    return `[array: ${value.length} items]`;
  }
  if (value && typeof value === 'object') {
    return `[object: ${Object.keys(value).length} fields]`;
  }
  return value;
}

function summarizeResponseValue(value: unknown) {
  if (value === undefined || value === null) {
    return '[no body]';
  }
  return summarizeRequestValue(value);
}

function sanitizeResponseForLogging(value: unknown, key?: string): unknown {
  if (key && isSensitiveResponseKey(key)) {
    return '[redacted]';
  }
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeResponseForLogging(item));
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([childKey, childValue]) => [
        childKey,
        sanitizeResponseForLogging(childValue, childKey),
      ])
    );
  }
  return value;
}

function isSensitiveBodyKey(key: string) {
  return /password|token|secret|authorization|cookie|email|image|key|route|store|item|inventory|location|value|body/i.test(
    key
  );
}

function isSensitiveResponseKey(key: string) {
  return /password|token|secret|authorization|cookie/i.test(key);
}

function getSafeErrorMessage(message: string) {
  return message
    .replace(/(password|token|secret|authorization|cookie)=?[^\s,}]+/gi, '$1=[redacted]')
    .replace(/[0-9a-f]{24}/gi, '[id]')
    .replace(/[0-9a-f-]{20,}/gi, '[id]');
}
