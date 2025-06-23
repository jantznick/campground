import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// API paths that an unverified user is allowed to access.
const whitelistedPaths = [
  '/api/v1/auth/verify-email',
  '/api/v1/auth/resend-verification',
  '/api/v1/auth/me',
  '/api/v1/auth/logout'
];

export const protect = (req, res, next) => {
  if (req.isAuthenticated()) {
    // An authenticated user can proceed if their email is verified
    // or if they are accessing an essential, whitelisted endpoint.
    // We use req.originalUrl because req.path can be modified by Express routers.
    if (req.user.emailVerified || whitelistedPaths.some(p => req.originalUrl.startsWith(p))) {
      return next();
    }
    
    // Otherwise, they are authenticated but not yet verified.
    return res.status(403).json({
      error: 'Email not verified.',
      code: 'EMAIL_NOT_VERIFIED'
    });
  }

  // If the user isn't authenticated at all, deny access.
  res.status(401).json({ error: 'Not authorized, no session' });
}; 