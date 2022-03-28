import { Request, Response, Application } from 'express';
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import compression from 'compression';
import helmet from 'helmet';
import xss from 'xss-clean';
import config from './utils/config';
import logger from './utils/logger';
import rateLimiter from './middlewares/rate-limiter';
import tooBusyMiddleware from './middlewares/too-busy';
import morganMiddleware from './middlewares/morgan';

const app: Application = express();

let corsOptions = {
  origin: 'http://example.com',
  optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
};

app.use(cors());
app.use(xss());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(morganMiddleware);
app.use(compression());
app.use(helmet());
app.use(rateLimiter);

app.use(tooBusyMiddleware);
app.get('/ping/', (req: Request, res: Response) => {
  // logger.profile('meaningful-name');
  // logger.error('test');
  // logger.info('test');
  // logger.profile('meaningful-name');
  res.send('pong');
});

const server = app.listen(config.port, () => {
  console.log(`listening at ${config.port}`);
});

process.on('SIGTERM', function () {
  server.close(function () {
    process.exit(0);
  });
});
