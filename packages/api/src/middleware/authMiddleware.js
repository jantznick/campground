import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const protect = async (req, res, next) => {
  const token = req.cookies.sessionToken;

  if (!token) {
    return res.status(401).json({ error: 'Not authorized, no token' });
  }

  try {
    const session = await prisma.session.findUnique({
      where: { sessionToken: token },
    });

    if (!session) {
      return res.status(401).json({ error: 'Not authorized, invalid session' });
    }

    // Check if session is expired
    if (new Date() > new Date(session.expires)) {
        await prisma.session.delete({ where: { sessionToken: token } });
        return res.status(401).json({ error: 'Not authorized, session expired' });
    }
    
    // Get user with their memberships
    const user = await prisma.user.findUnique({
        where: { id: session.userId },
        include: {
            memberships: {
                select: {
                    role: true,
                    organizationId: true,
                    companyId: true,
                    teamId: true,
                    projectId: true
                }
            }
        }
    });

    if (!user) {
        return res.status(401).json({ error: 'Not authorized, user not found' });
    }
    
    // Attach user to the request object (excluding password)
    const { password, ...userWithoutPassword } = user;
    req.user = userWithoutPassword;

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({ error: 'Not authorized, token failed' });
  }
}; 