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
