import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { protect } from '../middleware/authMiddleware.js';
import { hasPermission } from '../utils/permissions.js';
import passport from 'passport';
import { decrypt } from '../utils/crypto.js';
import { dynamicOidcStrategy } from '../utils/passport.js';

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

    if (inviteToken) {
      // Find the invitation, add user to the corresponding tenant with the specified role
      // For now, we'll just return an error.
      return res.status(501).json({ error: 'Invite token functionality not yet implemented.' });
    } else {
      // Auto-join logic
      const domain = email.split('@')[1];
      if (domain) {
        // Check for company-level match first
        const companyDomain = await prisma.autoJoinDomain.findFirst({
          where: { 
            domain: domain.toLowerCase(), 
            companyId: { not: null },
            status: 'VERIFIED'
          }
        });

        if (companyDomain) {
          const user = await prisma.user.create({
            data: {
              email,
              password: hashedPassword,
              memberships: {
                create: {
                  role: companyDomain.role,
                  companyId: companyDomain.companyId
                }
              }
            }
          });
          // Note: user is created, proceed to create session and log them in
          req.login(user, (err) => {
            if (err) {
              console.error('Login after registration error:', err);
              return res.status(500).json({ error: 'An error occurred during login after registration.' });
            }
            const { password: _, ...userWithoutPassword } = user;
            return res.status(201).json(userWithoutPassword);
          });
        }

        // Then check for organization-level match
        const orgDomain = await prisma.autoJoinDomain.findFirst({
          where: { 
            domain: domain.toLowerCase(), 
            organizationId: { not: null },
            status: 'VERIFIED'
          }
        });

        if (orgDomain) {
          const user = await prisma.user.create({
            data: {
              email,
              password: hashedPassword,
              memberships: {
                create: {
                  role: orgDomain.role,
                  organizationId: orgDomain.organizationId
                }
              }
            }
          });
          req.login(user, (err) => {
            if (err) {
              console.error('Login after registration error:', err);
              return res.status(500).json({ error: 'An error occurred during login after registration.' });
            }
            const { password: _, ...userWithoutPassword } = user;
            return res.status(201).json(userWithoutPassword);
          });
        }
      }
      
      // If no invite token and no auto-join domain, create a new Organization
      const orgData = {
        name: `${email.split('@')[0]}'s Organization`,
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
      req.login(user, (err) => {
        if (err) {
          console.error('Login after registration error:', err);
          return res.status(500).json({ error: 'An error occurred during login after registration.' });
        }
        const { password: _, ...userWithoutPassword } = user;
        return res.status(201).json(userWithoutPassword);
      });
    }

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'An error occurred during registration.' });
  }
});

router.post('/login', async (req, res, next) => {
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

        if (!user || !user.password) {
            return res.status(401).json({ error: 'Invalid credentials.' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid credentials.' });
        }

        // Use req.login provided by Passport
        req.login(user, (err) => {
            if (err) { return next(err); }
            
            // We don't want to send the password hash back
            const { password: _, ...userWithoutPassword } = user;
            return res.status(200).json(userWithoutPassword);
        });

    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ error: 'An error occurred during login.' });
    }
});

router.post('/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    res.clearCookie('connect.sid'); // The default session cookie name from express-session
    res.status(200).json({ message: 'Logged out successfully.' });
  });
});

// GET /api/v1/auth/check-domain - Check if a domain is registered for auto-join
router.get('/check-domain', async (req, res) => {
    const { domain } = req.query;

    if (!domain) {
        return res.status(400).json({ error: 'Domain is required.' });
    }

    try {
        // Company-level match has precedence
        const companyDomain = await prisma.autoJoinDomain.findFirst({
            where: { 
                domain: domain.toLowerCase(),
                companyId: { not: null },
                status: 'VERIFIED'
            },
            include: { company: { select: { name: true } } }
        });

        if (companyDomain) {
            return res.status(200).json({
                willJoin: true,
                entityType: 'company',
                entityName: companyDomain.company.name
            });
        }

        // Organization-level match
        const orgDomain = await prisma.autoJoinDomain.findFirst({
            where: {
                domain: domain.toLowerCase(),
                organizationId: { not: null },
                status: 'VERIFIED'
            },
            include: { organization: { select: { name: true } } }
        });

        if (orgDomain) {
            return res.status(200).json({
                willJoin: true,
                entityType: 'organization',
                entityName: orgDomain.organization.name
            });
        }

        // No match found
        res.status(200).json({ willJoin: false });

    } catch (error) {
        console.error('Check domain error:', error);
        res.status(500).json({ error: 'Failed to check domain.' });
    }
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

// OIDC Authentication Routes
// This route starts the OIDC login process (SP-initiated)
router.get('/auth/oidc', dynamicOidcStrategy, (req, res, next) => {
  passport.authenticate('oidc')(req, res, next);
});

// This is the callback URL for the OIDC provider.
// It handles both SP-initiated (GET) and IdP-initiated (POST) flows.
router.all('/auth/oidc/callback', dynamicOidcStrategy, (req, res, next) => {
  passport.authenticate('oidc', {
    successRedirect: process.env.WEB_URL, // Redirect to frontend app
    failureRedirect: `${process.env.WEB_URL}/login?error=oidc_failed`,
  })(req, res, next);
});

// A route to get the current authenticated user's info
router.get('/me', protect, (req, res) => {
    // If the middleware succeeds, req.user will be populated
    res.status(200).json(req.user);
});

// GET /api/v1/auth/oidc-status?email=...
// Checks if a domain has an active OIDC configuration.
// This is a public endpoint used by the login page.
router.get('/oidc-status', async (req, res) => {
  const { email } = req.query;
  if (!email || !email.includes('@')) {
    return res.json({ ssoEnabled: false });
  }
  const domain = email.split('@')[1].toLowerCase();

  try {
    const autoJoinDomain = await prisma.autoJoinDomain.findFirst({
      where: { domain },
      include: { organization: { include: { oidcConfiguration: true } } }
    });

    const org = autoJoinDomain?.organization;
    const oidcConfig = org?.oidcConfiguration;

    if (oidcConfig && oidcConfig.isEnabled) {
      return res.json({
        ssoEnabled: true,
        buttonText: oidcConfig.buttonText,
        organizationId: org.id
      });
    }

    res.json({ ssoEnabled: false });
  } catch (error) {
    console.error('Error checking OIDC status:', error);
    res.status(500).json({ error: 'Server error checking OIDC status.' });
  }
});

export default router; 