import rateLimit from 'express-rate-limit';

const rateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hr in milliseconds
  max: 1000, // maximum number of request inside a window
  message: 'You have exceeded the 100 requests in 24 hrs limit!', // the message when they exceed limit
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

export default rateLimiter;
