import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { protect } from '../middleware/authMiddleware.js';

const prisma = new PrismaClient();
const router = Router();
const saltRounds = 10;

router.post('/register', async (req, res) => {
  const { email, password, inviteToken } = req.body;
  console.log('register', req.body);

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ error: 'User with this email already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // TODO: Implement invite token logic
    if (inviteToken) {
        // Find the invitation, add user to the corresponding tenant with the specified role
        // For now, we'll just return an error.
        return res.status(501).json({ error: 'Invite token functionality not yet implemented.' });
    } else {
        // If no invite token, create a new Organization and a default Company for the user.
        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                memberships: {
                    create: {
                        role: 'ADMIN',
                        organization: {
                            create: {
                                name: `${email}'s Organization`,
                                companies: {
                                    create: {
                                        name: 'Default Company'
                                    }
                                }
                            }
                        }
                    }
                }
            },
            include: {
                memberships: {
                    include: {
                        organization: true
                    }
                }
            }
        });
        
        // Auto-login: create a session for the new user
        const sessionToken = crypto.randomBytes(32).toString('hex');
        const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        await prisma.session.create({
            data: {
                userId: user.id,
                sessionToken,
                expires,
            },
        });

        res.cookie('sessionToken', sessionToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            expires: expires,
            sameSite: 'lax'
        });

        // We don't want to send the password hash back
        const { password: _, ...userWithoutPassword } = user;
        res.status(201).json(userWithoutPassword);
    }

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'An error occurred during registration.' });
  }
});

router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required.' });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { email },
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
            return res.status(401).json({ error: 'Invalid credentials.' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid credentials.' });
        }

        // Create a session
        const sessionToken = crypto.randomBytes(32).toString('hex');
        const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        const session = await prisma.session.create({
            data: {
                userId: user.id,
                sessionToken,
                expires,
            },
        });
        
        const { password: _, ...userWithoutPassword } = user;

        res.cookie('sessionToken', session.sessionToken, {
            httpOnly: true, // Not accessible via JavaScript
            secure: process.env.NODE_ENV === 'production', // Only send over HTTPS in production
            expires: expires,
            sameSite: 'lax'
        });

        res.status(200).json(userWithoutPassword);

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'An error occurred during login.' });
    }
});

router.post('/logout', (req, res) => {
    res.clearCookie('sessionToken');
    res.status(200).json({ message: 'Logged out successfully' });
});

// A protected route to get the current user's details
router.get('/me', protect, (req, res) => {
    // If the middleware succeeds, req.user will be populated
    res.status(200).json(req.user);
});

export default router; 