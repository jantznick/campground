import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { protect } from '../middleware/authMiddleware.js';
import { hasPermission } from '../utils/permissions.js';
import passport from 'passport';
import { decrypt } from '../utils/crypto.js';
import { dynamicOidcStrategy } from '../utils/passport.js';
import { sendEmail } from '../utils/email.js';
import { ForgotPassword } from '../../../emails/emails/ForgotPassword.jsx';
import { NewUserWelcome } from '../../../emails/emails/NewUserWelcome.jsx';
import { AdminAutoJoinNotification } from '../../../emails/emails/AdminAutoJoinNotification.jsx';

const prisma = new PrismaClient();
const router = Router();
const saltRounds = 10;

const generateVerificationToken = () => ({
  verificationToken: crypto.randomInt(100000, 999999).toString(),
  verificationTokenExpiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes from now
});

const sanitizeUser = (user) => {
  const { password, verificationToken, verificationTokenExpiresAt, ...sanitized } = user;
  return sanitized;
};

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

    const { verificationToken, verificationTokenExpiresAt } = generateVerificationToken();
    const loginUrl = `${process.env.WEB_URL}/login`;

    if (inviteToken) {
      const invitation = await prisma.invitation.findUnique({
        where: { 
          token: inviteToken,
          expires: { gt: new Date() } 
        },
      });

      if (!invitation) {
        return res.status(400).json({ error: 'Invalid or expired invitation token.' });
      }

      // The user should already exist in a pending state
      const userToUpdate = await prisma.user.findUnique({
        where: { id: invitation.userId }
      });

      if (!userToUpdate || userToUpdate.email !== email) {
        return res.status(400).json({ error: 'Invitation is not valid for this email address.' });
      }

      const updatedUser = await prisma.user.update({
        where: { id: invitation.userId },
        data: {
          password: hashedPassword,
          emailVerified: false,
          verificationToken,
          verificationTokenExpiresAt,
        },
      });

      await prisma.invitation.delete({ where: { id: invitation.id } });

      await sendEmail({
        to: updatedUser.email,
        subject: 'Welcome to Campground!',
        react: NewUserWelcome({
          firstName: updatedUser.name || updatedUser.email.split('@')[0],
          loginUrl: loginUrl,
          verificationCode: verificationToken,
        })
      });

      req.login(updatedUser, (err) => {
        if (err) {
          console.error('Login after invitation accept error:', err);
          return res.status(500).json({ error: 'An error occurred during login.' });
        }
        return res.status(200).json(sanitizeUser(updatedUser));
      });
      return; // End execution here
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
              emailVerified: false,
              verificationToken,
              verificationTokenExpiresAt,
              memberships: {
                create: {
                  role: companyDomain.role,
                  companyId: companyDomain.companyId
                }
              }
            }
          });
		  
          const admins = await prisma.user.findMany({
            where: {
              memberships: {
                some: {
                  companyId: companyDomain.companyId,
                  role: 'ADMIN',
                },
              },
            },
          });

          const company = await prisma.company.findUnique({ where: { id: companyDomain.companyId }});

          for (const admin of admins) {
            await sendEmail({
			  from: 'Campground <donotreply@mail.campground.creativeendurancelab.com>',
              to: admin.email,
              subject: `A new user has joined ${company.name}`,
              react: AdminAutoJoinNotification({
				adminName: admin.name || admin.email,
				newUserName: user.name || user.email,
				newUserEmail: user.email,
				itemName: company.name,
			  }),
            });
          }

          await sendEmail({
            to: user.email,
            subject: 'Welcome to Campground!',
            react: NewUserWelcome({
              firstName: user.name || user.email.split('@')[0],
              loginUrl: loginUrl,
              verificationCode: verificationToken,
            })
          });

          // Note: user is created, proceed to create session and log them in
          req.login(user, (err) => {
            if (err) {
              console.error('Login after registration error:', err);
              return res.status(500).json({ error: 'An error occurred during login after registration.' });
            }
            return res.status(201).json(sanitizeUser(user));
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
              emailVerified: false,
              verificationToken,
              verificationTokenExpiresAt,
              memberships: {
                create: {
                  role: orgDomain.role,
                  organizationId: orgDomain.organizationId
                }
              }
            }
          });
		  
          const admins = await prisma.user.findMany({
            where: {
              memberships: {
                some: {
                  organizationId: orgDomain.organizationId,
                  role: 'ADMIN',
                },
              },
            },
          });

          const organization = await prisma.organization.findUnique({ where: { id: orgDomain.organizationId }});

          for (const admin of admins) {
            await sendEmail({
              to: admin.email,
              subject: `A new user has joined ${organization.name}`,
              react: AdminAutoJoinNotification({
                adminName: admin.name || admin.email,
                newUserName: user.name || user.email,
                newUserEmail: user.email,
                itemName: organization.name,
              }),
            });
          }

          await sendEmail({
            to: user.email,
            subject: 'Welcome to Campground!',
            react: NewUserWelcome({
              firstName: user.name || user.email.split('@')[0],
              loginUrl: loginUrl,
              verificationCode: verificationToken,
            })
          });

          req.login(user, (err) => {
            if (err) {
              console.error('Login after registration error:', err);
              return res.status(500).json({ error: 'An error occurred during login after registration.' });
            }
            return res.status(201).json(sanitizeUser(user));
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
          emailVerified: false,
          verificationToken,
          verificationTokenExpiresAt,
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
      
      await sendEmail({
        to: user.email,
        subject: 'Welcome to Campground!',
        react: NewUserWelcome({
          firstName: user.name || user.email.split('@')[0],
          loginUrl: loginUrl,
          verificationCode: verificationToken,
        })
      });

      // Auto-login: create a session for the new user
      req.login(user, (err) => {
        if (err) {
          console.error('Login after registration error:', err);
          return res.status(500).json({ error: 'An error occurred during login after registration.' });
        }
        return res.status(201).json(sanitizeUser(user));
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

        if (!user.emailVerified) {
          const { verificationToken, verificationTokenExpiresAt } = generateVerificationToken();
          const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: {
              verificationToken,
              verificationTokenExpiresAt,
            },
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

          const loginUrl = `${process.env.WEB_URL}/login`;
          await sendEmail({
            to: updatedUser.email,
            subject: 'Verify Your Email Address',
            react: NewUserWelcome({
              firstName: updatedUser.name || updatedUser.email.split('@')[0],
              loginUrl: loginUrl,
              verificationCode: verificationToken,
            })
          });
          
          req.login(updatedUser, (err) => {
            if (err) { return next(err); }
            return res.status(200).json(sanitizeUser(updatedUser));
          });
          return;
        }

        // Use req.login provided by Passport
        req.login(user, (err) => {
            if (err) { return next(err); }
            
            // We don't want to send the password hash back
            return res.status(200).json(sanitizeUser(user));
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

router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required.' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.password) {
      // To prevent account enumeration, we'll send a generic success response
      // even if the user doesn't exist or is an SSO user.
      console.log(`Password reset requested for non-existent or SSO user: ${email}`);
      return res.status(200).json({ message: 'If an account with that email exists, a password reset link has been sent.' });
    }

    // Invalidate any existing reset tokens for this user
    await prisma.passwordResetToken.deleteMany({
      where: { userId: user.id },
    });

    // Generate a secure selector and validator
    const selector = crypto.randomBytes(16).toString('hex');
    const validator = crypto.randomBytes(32).toString('hex');
    
    const hashedValidator = await bcrypt.hash(validator, saltRounds);

    // Set token expiration (e.g., 1 hour from now)
    const expiresAt = new Date(Date.now() + 3600000); // 1 hour

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        selector,
        token: hashedValidator,
        expiresAt,
      },
    });

    // For now, log the reset link to the console instead of emailing it
    // The token combines the selector and validator
    const resetToken = `${selector}.${validator}`;
    const resetLink = `${process.env.WEB_URL}/reset-password?password_reset_token=${resetToken}`;

	console.log(resetLink);
    await sendEmail({
      to: email,
      subject: 'Reset Your Campground Password',
      react: ForgotPassword({
        firstName: user.name || 'User',
        resetLink: resetLink,
      }),
    });

    res.status(200).json({ message: 'If an account with that email exists, a password reset link has been sent.' });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'An error occurred while processing your request.' });
  }
});

router.post('/reset-password', async (req, res) => {
  const { token, password } = req.body;

  if (!token || !password) {
    return res.status(400).json({ error: 'Token and new password are required.' });
  }

  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters long.' });
  }

  try {
    const [selector, validator] = token.split('.');

    if (!selector || !validator) {
      return res.status(400).json({ error: 'Invalid token format.' });
    }

    const passwordResetToken = await prisma.passwordResetToken.findUnique({
      where: {
        selector,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    if (!passwordResetToken) {
      return res.status(400).json({ error: 'Invalid or expired password reset token.' });
    }

    const isValidatorValid = await bcrypt.compare(validator, passwordResetToken.token);

    if (!isValidatorValid) {
        return res.status(400).json({ error: 'Invalid or expired password reset token.' });
    }

    const newHashedPassword = await bcrypt.hash(password, saltRounds);

    await prisma.user.update({
      where: { id: passwordResetToken.userId },
      data: { password: newHashedPassword },
    });

    await prisma.passwordResetToken.delete({
      where: { id: passwordResetToken.id },
    });

    res.status(200).json({ message: 'Password has been reset successfully.' });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'An error occurred while resetting your password.' });
  }
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
        res.status(200).json(sanitizeUser(userWithoutPassword));

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
    res.status(200).json(sanitizeUser(req.user));
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

router.post('/verify-email', protect, async (req, res) => {
  const { token } = req.body;
  const userId = req.user.id;

  if (!token) {
    return res.status(400).json({ error: 'Verification token is required.' });
  }

  try {
    const user = await prisma.user.findFirst({
      where: {
        id: userId,
        verificationToken: token,
      },
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid verification token.' });
    }

    if (new Date() > user.verificationTokenExpiresAt) {
      return res.status(400).json({ error: 'Verification token has expired.' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        emailVerified: true,
        verificationToken: null,
        verificationTokenExpiresAt: null,
      },
    });
    
    res.status(200).json(sanitizeUser(updatedUser));
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({ error: 'An error occurred during email verification.' });
  }
});

router.post('/resend-verification', protect, async (req, res) => {
  const userId = req.user.id;

  try {
    const { verificationToken, verificationTokenExpiresAt } = generateVerificationToken();

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        verificationToken,
        verificationTokenExpiresAt,
      },
    });

    const loginUrl = `${process.env.WEB_URL}/login`;
    await sendEmail({
      to: user.email,
      subject: 'Verify Your Email Address',
      react: NewUserWelcome({
        firstName: user.name || user.email.split('@')[0],
        loginUrl: loginUrl,
        verificationCode: verificationToken,
      })
    });

    res.status(200).json({ message: 'A new verification code has been sent.' });
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({ error: 'An error occurred while resending the verification code.' });
  }
});

export default router; 