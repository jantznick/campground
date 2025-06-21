import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const protect = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: 'Not authorized, no session' });
}; 