import { format, transports, createLogger } from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

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

const infoTransport: DailyRotateFile = new DailyRotateFile({
  filename: 'logs/info-%DATE%.log',
  datePattern: 'HH-DD-MM-YYYY',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '14d',
  level: 'info',
  format: format.combine(infoFilter(), format.timestamp(), json()),
});

const httpTransport: DailyRotateFile = new DailyRotateFile({
  filename: 'logs/http-%DATE%.log',
  datePattern: 'HH-DD-MM-YYYY',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '5d',
  level: 'http',
  format: format.combine(httpFilter(), format.timestamp(), json()),
});

const errorTransport: DailyRotateFile = new DailyRotateFile({
  filename: 'logs/error-%DATE%.log',
  datePattern: 'HH-DD-MM-YYYY',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '15d',
  level: 'error',
  format: format.combine(errorFilter(), format.timestamp(), json()),
});

const logger = createLogger({
  format: combine(
    timestamp(),
    json(),
    format.printf((info) => `${info.timestamp} ${info.level}: ${info.message}`),
  ),
  transports: [new transports.Console(), httpTransport, infoTransport, errorTransport],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new transports.Console({
      format: format.combine(format.colorize(), format.simple()),
    }),
  );
}
export default logger;
