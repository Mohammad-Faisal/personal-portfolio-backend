## Features

- Typescript
- Eslint
- Prettier
- Husky
- Environment
- Testing setup
- Error handling
- Logger
- Rate limiter
- Security against xss
- Load testing
- Using Sequalize ORM

### Body Parser

```sh
npm i body-parser
```

```js
import bodyParser from 'body-parser';
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
```

### Environment Variables

```sh
npm i dotenv
```

Create a .env file and put something inside it

```
APPLICATION_PORT = 4000
```

```js
import 'dotenv/config';

console.log(process.env.APPLICATION_PORT);
```

or like this

```js
import dotenv from 'dotenv';
const configuration: any = dotenv.config().parsed;

console.log(configuration.APPLICATION_PORT);
```

### Multiple Environment

Install **cross-env** so that we don't face issues loading the environment from windows shells

```sh
yarn add -D cross-env
```

Create files according to environment like **.env.development** and **.env.production**

Then create separate scripts for those inside **package.json**

```json
"dev": "cross-env NODE_ENV=development ts-node-dev --respawn src/index.ts",
"prod": "cross-env NODE_ENV=production ts-node-dev --respawn src/index.ts",
```

Then modify the config file like this:

```js
import dotenv from 'dotenv';
dotenv.config({ path: __dirname + `/./../../.env.${process.env.NODE_ENV}` });

const config = {
  port: process.env.APPLICATION_PORT,
};

export default config;
```

That's it

### Add Husky

```sh
yarn add -D husky
```

Then add the following commands inside the **package.json**

```json
"husky": {
    "hooks": {
      "pre-commit": "yarn lint"
    }
}
```

### Logging

There are several libraries for logging but the best of them are [winston](https://www.npmjs.com/package/winston)

```sh
yarn add winston
```

Then create a logger for logging

```js
import { format, transports, createLogger } from 'winston';

const logger = createLogger({
  format: format.combine(format.timestamp(), format.json()),
  transports: [new transports.Console(), new transports.File({ level: 'error', filename: 'errors.log' })],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new transports.Console({
      format: format.combine(format.colorize(), format.simple()),
    }),
  );
}

export default logger;
```

Cool thing about winston is we can use multiple transports which means we can give output to different systems. For example
in the above example we are giving error logs to a file named **errors.log** but all other levels are going to be in the console

we can control the format of the logging by using **format**. Which is available in [logform](https://github.com/winstonjs/logform#readme) library

We are clorizing the development logging at the end
Then use the logger by doing something like this

```js
import logger from './utils/logger';

logger.error('test');
```

We can also add context or service level information for better understanding.

```js
const logger = createLogger({
  defaultMeta: {
    service: 'billing-service',
  },
  //... other configs
});
```

In this case a service field will also be added to the log object.

Sometimes we need individual log level control. For example if we want to track the flow of a user we may need to add that info for each level of that information. That is not possible with service level customization

For this purpose we can use [child-logger](https://github.com/winstonjs/winston#creating-child-loggers)

This concept allows us to inject context information about individual log entries.

```js
import logger from './utils/logger';

const childLogger = logger.child({ requestId: '451' });
childLogger.error('test');
```

We can also log exceptions and unhandled promise rejections in the event of a failure.
winston provides us with a nice tool for that. We can

```js
const logger = createLogger({
  transports: [new transports.File({ filename: 'file.log' })],
  exceptionHandlers: [new transports.File({ filename: 'exceptions.log' })],
  rejectionHandlers: [new transports.File({ filename: 'rejections.log' })],
});
```

We can profile our requests in a simple way

```js
app.get('/ping/', (req: Request, res: Response) => {
  console.log(req.body);
  logger.profile('meaningful-name');
  // do something
  logger.profile('meaningful-name');
  res.send('pong');
});
```

This will give an output of additional output about the performance

```json
{ "durationMs": 5, "level": "info", "message": "meaningful-name", "timestamp": "2022-03-12T17:40:59.093Z" }
```

You can see [more examples with winston here](https://github.com/winstonjs/winston/tree/master/examples)

## Using Morgan

This far you should understand why winston is one of the best if not the best logging library. But it's used for general purpose logging. There is another library that can help us with more sophisticated logging especially for http requests.
That library is called [morgan](https://www.npmjs.com/package/morgan)

First create a middleware that will intercept all the requests. I am adding it inside **middlewares/morgan.ts** file.

```js
import morgan, { StreamOptions } from 'morgan';

import Logger from '../utils/logger';

// Override the stream method by telling
// Morgan to use our custom logger instead of the console.log.
const stream: StreamOptions = {
  write: (message) => Logger.http(message),
};

const skip = () => {
  const env = process.env.NODE_ENV || 'development';
  return env !== 'development';
};

const morganMiddleware = morgan(':method :url :status :res[content-length] - :response-time ms :remote-addr', {
  stream,
  skip,
});

export default morganMiddleware;
```

Notice how we modified our stream method to use the winston logger.
There are some predefined log formats for morgan like **tiny** and **combined** You can use those like the following

```js
const morganMiddleware = morgan('combined', {
  stream,
  skip,
});
```

This will give output in a separate format

Now use this middleware inside out **index.ts** file.

```js
import morganMiddleware from './middlewares/morgan';

app.use(morganMiddleware);
```

Now all out requests will be logged inside the winston with http level

```json
{ "level": "http", "message": "GET /ping 304 - - 11.140 ms ::1\n", "timestamp": "2022-03-12T19:57:43.166Z" }
```

We can create a separate log file for http logs by updating out winston logger a bit. The final version can look something like this

```js
import { format, transports, createLogger } from 'winston';

const { combine, timestamp, json, align } = format;
const errorFilter = format((info, opts) => {
  return info.level === 'error' ? info : false;
});

const infoFilter = format((info, opts) => {
  return info.level === 'info' ? info : false;
});

const httpFilter = format((info, opts) => {
  return info.level === 'http' ? info : false;
});

const logger = createLogger({
  format: combine(
    timestamp(),
    json(),
    format.printf((info) => `${info.timestamp} ${info.level}: ${info.message}`),
  ),
  transports: [
    new transports.Console(),
    new transports.File({
      level: 'http',
      filename: 'logs/http.log',
      format: format.combine(httpFilter(), format.timestamp(), json()),
    }),
    new transports.File({
      level: 'info',
      filename: 'logs/info.log',
      format: format.combine(infoFilter(), format.timestamp(), json()),
    }),
    new transports.File({
      level: 'error',
      filename: 'logs/errors.log',
      format: format.combine(errorFilter(), format.timestamp(), json()),
    }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new transports.Console({
      format: format.combine(format.colorize(), format.simple()),
    }),
  );
}
export default logger;
```

Now in a production system maintaining these log files can be a pain in the a\*\*. That's why there is a nice module named [winston-daily-rotate-file](https://www.npmjs.com/package/winston-daily-rotate-file)

We can use this to configure in such a way so that our log files rotate daily

First install it

```sh
yarn add winston-daily-rotate-file
```

Then replace our transports inside the winston

```js
const infoTransport: DailyRotateFile = new DailyRotateFile({
  filename: 'logs/info-%DATE%.log',
  datePattern: 'HH-DD-MM-YYYY',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '14d',
  level: 'info',
  format: format.combine(infoFilter(), format.timestamp(), json()),
});
```

do this for all the log levels and pass it inside the transports in winston

```js
transports: [new transports.Console(), httpTransport, infoTransport, errorTransport],
```

Now you will see new log files inside the logs folder named in the format we specified.

That should take care of all your logging problems.

### Testing

We will use jest for testing. First install it

```sh
yarn add -D jest @types/jest
```

Then add a command in **package.json** for test

```json
"scripts": {
    "test": "jest"
},
```

Now create a sample test. The convention is creating it inside **\_\_tests\_\_** folder

```js
test('Multiplying two numbers', async () => {
  expect(1).toBe(1);
});
```

Then run the command

```sh
yarn test
```

It will show you all the passing tests

Now let's create a coverage for the tests as well. Add another command inside **package.json**

```json
"scripts": {
    "test": "jest",
    "test-coverage": "jest --coverage"
},
```

And if you run

```sh
yarn test-coverage
```

It will generate the test coverage report for you

### Compression

Compression is a technique that can reduce the size of the static file and json response
In nodejs that can be done with a nice middleware package named [**compression**](https://www.npmjs.com/package/compression)

First install it

```sh
yarn add compression
```

Then add it inside your **index.ts**

```js
import compression from 'compression';
app.use(compression());
```

And that's it! There are other options that you can use. Refer to the documentation for that

### Security

We will first use another nice npm package named [helmet](https://www.npmjs.com/package/helmet) to define some of the http headers for us and provides some basic security features out of the box!

```sh
yarn add helmet
```

Then use it inside your **index.ts**

```js
import helmet from 'helmet';

app.use(helmet());
```

You should also take a look at [helmet-csp](https://www.npmjs.com/package/helmet-csp)

### Prevent DOS attack

DOS means Denial of Service. If an attacker tries to swamp your server with requests then our real users can feel the pain of slow response time.

To prevent this we can use a nice package named [toobusy-js](https://www.npmjs.com/package/toobusy-js)
This will monitor the event loop and we can define a lag parameter which will monitor the lag of the event loop and indicate if our event loop is too busy to serve requests right now.

```sh
yarn add toobusy-js
```

Then add a new middleware to indicate that the server is too busy right now.

```js
import toobusy from 'toobusy-js';

app.use(function (req, res, next) {
  if (toobusy()) {
    res.send(503, 'Server too busy!');
  } else {
    next();
  }
});
```

### Rate Limiting

Rate limiting helps your application from brute-force attacks. This helps to prevent the server from being throttled.

Unauthorized users can perform any number of requests with malicious intent and you can control that with rate-limiting.
For example you can allow a user to make 5 request per 15 minutes for creating account.
Or you can allow unsubscribed users to make requests at a certain rate limit. something like 100requests/day

There is a nice package named [express-rate-limit](https://www.npmjs.com/package/express-rate-limit). First install it

```sh
yarn add express-rate-limit
```

Then create a rate limiting configuration for it.

```js
import rateLimit from 'express-rate-limit';

export const rateLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hrs in milliseconds
  max: 100, // maximum number of request inside a window
  message: 'You have exceeded the 100 requests in 24 hrs limit!', // the message when they exceed limit
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

const app = express();

app.use(rateLimiter);
```

This will allow you to add rate limit for all of your routes. You can also just add rate-limiting for specific routes.

But if you are behind a proxy. Which is the case for most cases when you use any cloud provider like heroku aws etc then the IP of the request is basically the ip of the proxy which makes it look like that request is coming from a single source and the server gets clogged up pretty quick.

To resolve this issue you can find out the **numberOfProxies** between you and the server and set that count right after you create the express application

```js
const numberOfProxies = 1;
const app = express();

app.set('trust proxy', numberOfProxies);
```

To learn more about [**trust proxy**](https://expressjs.com/en/guide/behind-proxies.html) refer to the [documentation](https://expressjs.com/en/guide/behind-proxies.html)

### Configure Cors

CORS will keep your application safe from malicious attacks from unknown sources
It's really easy to configure in nodejs

```sh
npm i cors
```

then use it inside the index.ts file

```js
import cors from 'cors';

let corsOptions = {
  origin: 'http://example.com',
  optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
};
app.use(cors());
```

## Prevent XSS attacks

XSS attack means cross-site scripting attacks. It injects malicious scripts into your application.

An attacker can use XSS to send a malicious script to an unsuspecting user. The end user’s browser has no way to know that the script should not be trusted, and will execute the script. Because it thinks the script came from a trusted source, the malicious script can access any cookies, session tokens, or other sensitive information retained by the browser and used with that site.

You can protect your application by using **xss-clean**

```sh
yarn add xss-clean
```

Then use it inside the index.ts file

```js
import xss from 'xss-clean';

app.use(xss());
```

### Prevent SQL Query injection attacks

If you use Sequalize, TypeORM these type of orm tools then you are safe by default because these help us against the SQL query injection attacks by default

## Limit the size of the body of the request

Using [body-parser](https://github.com/expressjs/body-parser) you can set the limit on the size of the payload

```sh
npm i body-parser
```

By default body-parser is configured to allow 100kb payloads size. You can set the limit like the following

```js
import bodyParser from 'body-parser';
app.use(bodyParser.json({ limit: '50kb' }));
app.use(bodyParser.urlencoded({ extended: true }));
```

## Use linter

A linter can force you to follow these best practices by default. You can use [eslint-plugin-security](https://www.npmjs.com/package/eslint-plugin-security) for that.

```sh
yarn add -D eslint-plugin-security
```

And inside your **.eslintrc** file

```json
"extends": ["plugin:@typescript-eslint/recommended", "plugin:security/recommended"],
```

### Enforce HTTPS

You should always use HTTPS over HTTP when possible.

```sh
yarn add hsts
```

Then use it inside your **index.ts**

```js
import hsts from 'hsts';

app.use(
  hsts({
    maxAge: 15552000, // 180 days in seconds
  }),
);
```

### Use CSRF Protection middleware

To learn more about CSRF. [Go here](https://github.com/pillarjs/understanding-csrf)
COnsider using [csurf](https://github.com/expressjs/csurf)

```js
import csrf from 'csurf';
var csrfProtection = csrf({ cookie: true });

app.get('/form', csrfProtection, function (req, res) {
  // generate and pass the csrfToken to the view
  res.render('send', { csrfToken: req.csrfToken() });
});
```

#### Some more resource:

https://cheatsheetseries.owasp.org/cheatsheets/Nodejs_Security_Cheat_Sheet.html
https://medium.com/@nodepractices/were-under-attack-23-node-js-security-best-practices-e33c146cb87d

### Docker Support

Follow the following article for more information

https://www.mohammadfaisal.dev/blog/express-typescript-docker

### Graceful Shutdown

You can do that by using the following code

```js
const server = app.listen(config.port, () => {
  console.log(`listening at ${config.port}`);
});

process.on('SIGTERM', function () {
  server.close(function () {
    process.exit(0);
  });
});
```
