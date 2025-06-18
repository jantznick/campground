import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { protect } from '../middleware/authMiddleware.js';
import { hasPermission } from '../utils/permissions.js';

const prisma = new PrismaClient();
const router = Router();
const saltRounds = 10;

router.post('/register', async (req, res) => {
  const { email, password, inviteToken, accountType } = req.body;
  console.log('register', req.body);

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  if (!password || password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters long.' });
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
        const orgData = {
            name: `${email}'s Organization`,
            accountType: accountType || 'STANDARD', // Default to STANDARD
            companies: {}
        };

        if (accountType === 'STANDARD') {
            orgData.companies = {
                create: {
                    name: 'Default Company'
                }
            };
        }

        // If no invite token, create a new Organization and maybe a default Company for the user.
        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                memberships: {
                    create: {
                        role: 'ADMIN',
                        organization: {
                            create: orgData
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

// GET /api/v1/auth/invitation/:token - Verify an invitation token
router.get('/invitation/:token', async (req, res) => {
    const { token } = req.params;

    try {
        const invitation = await prisma.invitation.findUnique({
            where: { token },
        });

        if (!invitation || invitation.expires < new Date()) {
            return res.status(404).json({ error: 'Invitation not found or has expired.' });
        }

        res.status(200).json({ email: invitation.email });

    } catch (error) {
        console.error('Verify invitation error:', error);
        res.status(500).json({ error: 'Failed to verify invitation.' });
    }
});

// POST /api/v1/auth/accept-invitation
router.post('/accept-invitation', async (req, res) => {
    const { token, password } = req.body;

    if (!token || !password) {
        return res.status(400).json({ error: 'Token and password are required.' });
    }

    if (password.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters long.' });
    }

    try {
        const invitation = await prisma.invitation.findUnique({
            where: { token },
        });

        if (!invitation || invitation.expires < new Date()) {
            return res.status(400).json({ error: 'Invalid or expired invitation token.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.update({
            where: { id: invitation.userId },
            data: {
                password: hashedPassword,
            },
        });

        // Delete the invitation so it cannot be reused
        await prisma.invitation.delete({ where: { id: invitation.id } });

        // Create a session for the new user, same as in the /login route.
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
        res.status(200).json(userWithoutPassword);

    } catch (error) {
        console.error('Accept invitation error:', error);
        res.status(500).json({ error: 'Failed to accept invitation.' });
    }
});

// A protected route to get the current user's details
router.get('/me', protect, (req, res) => {
    // If the middleware succeeds, req.user will be populated
    res.status(200).json(req.user);
});

export default router; 