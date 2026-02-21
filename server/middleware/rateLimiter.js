const rateLimit = require('express-rate-limit');

const toNumber = (value, fallback) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const isProduction = process.env.NODE_ENV === 'production';
const disableRateLimiter = process.env.DISABLE_RATE_LIMITER === 'true' || !isProduction;

const apiWindowMs = toNumber(process.env.RL_API_WINDOW_MS, 10 * 60 * 1000);
const apiMax = toNumber(process.env.RL_API_MAX, isProduction ? 1200 : 5000);

const authWindowMs = toNumber(process.env.RL_AUTH_WINDOW_MS, 15 * 60 * 1000);
const authMax = toNumber(process.env.RL_AUTH_MAX, isProduction ? 20 : 500);

const toolWindowMs = toNumber(process.env.RL_TOOL_WINDOW_MS, 5 * 60 * 1000);
const toolMax = toNumber(process.env.RL_TOOL_MAX, isProduction ? 120 : 2000);

const defaultHandler = (defaultMessage) => (req, res) => {
    const retryAfter = Math.max(Math.ceil((req.rateLimit?.resetTime - Date.now()) / 1000), 1);
    res.status(429).json({
        success: false,
        message: defaultMessage,
        retryAfterSeconds: retryAfter,
    });
};

const isLocalRequest = (req) => {
    const ip = (req.ip || '').toLowerCase();
    const forwarded = (req.headers['x-forwarded-for'] || '').toLowerCase();
    const source = `${ip},${forwarded}`;
    return (
        source.includes('127.0.0.1') ||
        source.includes('::1') ||
        source.includes('localhost')
    );
};

const shouldSkipRateLimit = (req) => disableRateLimiter || isLocalRequest(req);

exports.apiLimiter = rateLimit({
    windowMs: apiWindowMs,
    max: apiMax,
    standardHeaders: true,
    legacyHeaders: false,
    skip: shouldSkipRateLimit,
    handler: defaultHandler('Too many requests from this IP. Please try again later.'),
});

exports.authLimiter = rateLimit({
    windowMs: authWindowMs,
    max: authMax,
    skipSuccessfulRequests: true,
    standardHeaders: true,
    legacyHeaders: false,
    skip: shouldSkipRateLimit,
    handler: defaultHandler('Too many login/register attempts. Please try again later.'),
});

exports.toolLimiter = rateLimit({
    windowMs: toolWindowMs,
    max: toolMax,
    standardHeaders: true,
    legacyHeaders: false,
    skip: shouldSkipRateLimit,
    handler: defaultHandler('Too many file-processing requests. Please wait and retry.'),
});
