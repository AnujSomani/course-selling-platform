// Fix #12: Rate limiting on auth endpoints to prevent brute-force attacks.
// - authLimiter   : 10 attempts per 15 minutes (signup, signin, verify-email)
// - resendLimiter : 3 resend attempts per 15 minutes (resend-verification-code)

const rateLimit = require("express-rate-limit");

const authLimiter = rateLimit({
  windowMs:        15 * 60 * 1000, // 15 minutes
  max:             10,
  standardHeaders: true,            // Return rate limit info in `RateLimit-*` headers
  legacyHeaders:   false,
  message:         { message: "Too many attempts. Please try again after 15 minutes." },
});

const resendLimiter = rateLimit({
  windowMs:        15 * 60 * 1000,
  max:             3,               // stricter — email sending is expensive
  standardHeaders: true,
  legacyHeaders:   false,
  message:         { message: "Too many resend requests. Please try again after 15 minutes." },
});

module.exports = { authLimiter, resendLimiter };
