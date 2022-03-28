import { NextFunction, Request, Response } from 'express';
import tooBusy from 'toobusy-js';
import logger from '../utils/logger';

export default function (req: Request, res: Response, next: NextFunction) {
  if (tooBusy()) {
    res.status(503).send('Server too busy!');
  } else {
    next();
  }
}

tooBusy.onLag(function (currentLag: any) {
  logger.error('Event loop lag detected! Latency: ' + currentLag + 'ms');
});
