import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { protect } from '../middleware/authMiddleware.js';
import passport from 'passport';
import { dynamicOidcStrategy } from '../utils/passport.js';
import { sendEmail } from '../utils/email.js';
import React from 'react';
import { ForgotPassword } from '../../../emails/emails/ForgotPassword.jsx';
import { NewUserWelcome } from '../../../emails/emails/NewUserWelcome.jsx';
import { AdminAutoJoinNotification } from '../../../emails/emails/AdminAutoJoinNotification.jsx';
import { MagicLinkLogin } from '../../../emails/emails/MagicLinkLogin.jsx';

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

// Reusable function to send a magic link
const sendMagicLink = async (user) => {
  const token = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

  await prisma.loginToken.create({
    data: {
      token: hashedToken,
      userId: user.id,
      expiresAt,
    },
  });

  const magicLink = `${process.env.WEB_URL}/login/verify?token=${token}`;
  
  await sendEmail({
    to: user.email,
    subject: 'Your Magic Login Link for Campground',
    react: React.createElement(MagicLinkLogin, {
      magicLink: magicLink,
    }),
  });
};

router.post('/register', async (req, res) => {
  const { email, password, accountType, useMagicLink } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required.' });
  }

  if (!useMagicLink && (!password || password.length < 8)) {
    return res.status(400).json({ error: 'Password must be at least 8 characters long.' });
  }

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ error: 'User with this email already exists.' });
    }

    const hashedPassword = useMagicLink ? null : await bcrypt.hash(password, saltRounds);
    
    // Auto-join & Standard Registration Logic
    const domain = email.split('@')[1];
    let autoJoinConfig = null;

    if(domain) {
      const companyDomain = await prisma.autoJoinDomain.findFirst({
          where: { domain: domain.toLowerCase(), companyId: { not: null }, status: 'VERIFIED' }
      });
      if (companyDomain) autoJoinConfig = { type: 'company', ...companyDomain };
      else {
          const orgDomain = await prisma.autoJoinDomain.findFirst({
              where: { domain: domain.toLowerCase(), organizationId: { not: null }, status: 'VERIFIED' }
          });
          if (orgDomain) autoJoinConfig = { type: 'organization', ...orgDomain };
      }
    }
    
    let newUser;

    if (autoJoinConfig) {
      newUser = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          emailVerified: false,
          memberships: {
            create: {
              role: autoJoinConfig.role,
              ...(autoJoinConfig.type === 'company' ? { companyId: autoJoinConfig.companyId } : {}),
              ...(autoJoinConfig.type === 'organization' ? { organizationId: autoJoinConfig.organizationId } : {}),
            }
          }
        },
        include: { memberships: { include: { organization: true, company: true } } }
      });
    } else {
      // If no auto-join, create a new org, a default company, and then the user.
      const newOrg = await prisma.organization.create({
        data: {
          name: `${email.split('@')[0]}'s Organization`,
          accountType: accountType || 'STANDARD',
          companies: {
            create: { name: 'Default Company' },
          },
        },
        include: {
          companies: { select: { id: true } },
        },
      });

      const defaultCompanyId = newOrg.companies[0].id;

      await prisma.organization.update({
        where: { id: newOrg.id },
        data: { defaultCompanyId },
      });
      
      newUser = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          emailVerified: false,
          memberships: {
            create: {
              role: 'ADMIN',
              organizationId: newOrg.id,
            },
          },
        },
        include: { memberships: { include: { organization: true, company: true } } }
      });
    }

    if (autoJoinConfig) {
      const entityId = autoJoinConfig.companyId || autoJoinConfig.organizationId;
      const entityType = autoJoinConfig.type;
      const admins = await prisma.user.findMany({
        where: { memberships: { some: { [`${entityType}Id`]: entityId, role: 'ADMIN' } } },
      });
      const entity = await prisma[entityType].findUnique({ where: { id: entityId } });
      for (const admin of admins) {
        await sendEmail({
          from: 'Campground <donotreply@mail.campground.creativeendurancelab.com>',
          to: admin.email,
          subject: `A new user has joined ${entity.name}`,
          react: React.createElement(AdminAutoJoinNotification, {
            adminName: admin.name || admin.email,
            newUserName: newUser.name || newUser.email,
            newUserEmail: newUser.email,
            itemName: entity.name,
          }),
        });
      }
    }

    if (useMagicLink) {
      await sendMagicLink(newUser);
      return res.status(201).json({ message: `A magic link has been sent to ${newUser.email}.` });
    } else {
      const { verificationToken, verificationTokenExpiresAt } = generateVerificationToken();
      await prisma.user.update({
        where: { id: newUser.id },
        data: { verificationToken, verificationTokenExpiresAt }
      });
      
      const loginUrl = `${process.env.WEB_URL}/login`;
      await sendEmail({
        to: newUser.email,
        subject: 'Welcome to Campground!',
        react: React.createElement(NewUserWelcome, {
          firstName: newUser.name || newUser.email.split('@')[0],
          loginUrl: loginUrl,
          verificationCode: verificationToken,
        })
      });

      req.login(newUser, (err) => {
        if (err) {
          console.error('Login after registration error:', err);
          return res.status(500).json({ error: 'An error occurred during login after registration.' });
        }
        return res.status(201).json(sanitizeUser(newUser));
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
            data: { verificationToken, verificationTokenExpiresAt },
          });

          const loginUrl = `${process.env.WEB_URL}/login`;
          await sendEmail({
            to: updatedUser.email,
            subject: 'Verify Your Email Address',
            react: React.createElement(NewUserWelcome, {
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

        req.login(user, (err) => {
            if (err) { return next(err); }
            return res.status(200).json(sanitizeUser(user));
        });

    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ error: 'An error occurred during login.' });
    }
});

router.post('/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) { return next(err); }
    res.clearCookie('connect.sid');
    res.status(200).json({ message: 'Logged out successfully.' });
  });
});

router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) { return res.status(400).json({ error: 'Email is required.' }); }

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !user.password) {
      console.log(`Password reset requested for non-existent or SSO user: ${email}`);
      return res.status(200).json({ message: 'If an account with that email exists, a password reset link has been sent.' });
    }

    await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });

    const selector = crypto.randomBytes(16).toString('hex');
    const validator = crypto.randomBytes(32).toString('hex');
    const hashedValidator = await bcrypt.hash(validator, saltRounds);
    const expiresAt = new Date(Date.now() + 3600000); // 1 hour

    await prisma.passwordResetToken.create({
      data: { userId: user.id, selector, token: hashedValidator, expiresAt },
    });

    const resetToken = `${selector}.${validator}`;
    const resetLink = `${process.env.WEB_URL}/reset-password?password_reset_token=${resetToken}`;

    await sendEmail({
      to: email,
      subject: 'Reset Your Campground Password',
      react: React.createElement(ForgotPassword, {
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
  if (!token || !password) { return res.status(400).json({ error: 'Token and new password are required.' }); }
  if (password.length < 8) { return res.status(400).json({ error: 'Password must be at least 8 characters long.' }); }

  try {
    const [selector, validator] = token.split('.');
    if (!selector || !validator) { return res.status(400).json({ error: 'Invalid token format.' }); }

    const passwordResetToken = await prisma.passwordResetToken.findUnique({
      where: { selector, expiresAt: { gt: new Date() } },
    });

    if (!passwordResetToken) { return res.status(400).json({ error: 'Invalid or expired password reset token.' }); }

    const isValidatorValid = await bcrypt.compare(validator, passwordResetToken.token);
    if (!isValidatorValid) { return res.status(400).json({ error: 'Invalid or expired password reset token.' }); }

    const newHashedPassword = await bcrypt.hash(password, saltRounds);
    await prisma.user.update({
      where: { id: passwordResetToken.userId },
      data: { password: newHashedPassword },
    });
    await prisma.passwordResetToken.delete({ where: { id: passwordResetToken.id } });
    res.status(200).json({ message: 'Password has been reset successfully.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'An error occurred while resetting your password.' });
  }
});

router.get('/check-domain', async (req, res) => {
    const { domain } = req.query;
    if (!domain) { return res.status(400).json({ error: 'Domain is required.' }); }

    try {
        const companyDomain = await prisma.autoJoinDomain.findFirst({
            where: { domain: domain.toLowerCase(), companyId: { not: null }, status: 'VERIFIED' },
            include: { company: { select: { name: true } } }
        });

        if (companyDomain) {
            return res.json({ willJoin: true, entityType: 'company', entityName: companyDomain.company.name });
        }

        const orgDomain = await prisma.autoJoinDomain.findFirst({
            where: { domain: domain.toLowerCase(), organizationId: { not: null }, status: 'VERIFIED' },
            include: { organization: { select: { name: true } } }
        });

        if (orgDomain) {
            return res.json({ willJoin: true, entityType: 'organization', entityName: orgDomain.organization.name });
        }
        res.json({ willJoin: false });
    } catch (error) {
        console.error('Check domain error:', error);
        res.status(500).json({ error: 'Failed to check domain.' });
    }
});

router.get('/invitation/:token', async (req, res) => {
    const { token } = req.params;
    try {
        const invitation = await prisma.invitation.findUnique({
            where: { token, expires: { gt: new Date() } },
        });
        if (!invitation) {
            return res.status(404).json({ error: 'Invitation not found or has expired.' });
        }
        res.json({ email: invitation.email });
    } catch (error) {
        console.error('Verify invitation error:', error);
        res.status(500).json({ error: 'Failed to verify invitation.' });
    }
});

router.post('/accept-invitation', async (req, res) => {
    const { token, password, useMagicLink } = req.body;

    if (!token) { return res.status(400).json({ error: 'Invitation token is required.' }); }
    if (!useMagicLink && (!password || password.length < 8)) {
        return res.status(400).json({ error: 'Password must be at least 8 characters long.' });
    }

    try {
        const invitation = await prisma.invitation.findUnique({
            where: { token, expires: { gt: new Date() } },
            include: { user: true }
        });

        if (!invitation || !invitation.user) {
            return res.status(400).json({ error: 'Invalid or expired invitation token.' });
        }
        
        const userToUpdate = invitation.user;

        if (useMagicLink) {
            await prisma.user.update({
                where: { id: userToUpdate.id },
                data: { emailVerified: true },
            });
            await sendMagicLink(userToUpdate);
            await prisma.invitation.delete({ where: { id: invitation.id } });
            return res.json({ message: 'Your account has been activated. A magic login link has been sent to your email.' });
        } else {
            const hashedPassword = await bcrypt.hash(password, 10);
            const updatedUser = await prisma.user.update({
                where: { id: userToUpdate.id },
                data: { password: hashedPassword, emailVerified: true },
            });
            await prisma.invitation.delete({ where: { id: invitation.id } });
            req.login(updatedUser, (err) => {
                if (err) {
                    console.error('Login after invitation accept error:', err);
                    return res.status(500).json({ error: 'An error occurred during login.' });
                }
                return res.json(sanitizeUser(updatedUser));
            });
        }
    } catch (error) {
        console.error('Accept invitation error:', error);
        res.status(500).json({ error: 'Failed to accept invitation.' });
    }
});

router.get('/oidc', dynamicOidcStrategy, passport.authenticate('oidc'));

router.all('/oidc/callback', dynamicOidcStrategy, passport.authenticate('oidc', {
    successRedirect: process.env.WEB_URL,
    failureRedirect: `${process.env.WEB_URL}/login?error=oidc_failed`,
}));

router.get('/me', protect, (req, res) => {
    res.json(sanitizeUser(req.user));
});

router.get('/check-oidc', async (req, res) => {
  const { email } = req.query;
  if (!email || !email.includes('@')) { return res.json({ ssoEnabled: false }); }
  const domain = email.split('@')[1].toLowerCase();

  try {
    const autoJoinDomain = await prisma.autoJoinDomain.findFirst({
      where: { domain, status: 'VERIFIED' },
      include: { organization: { include: { oidcConfiguration: true } } }
    });

    if (!autoJoinDomain?.organization?.oidcConfiguration) {
      return res.json({ ssoEnabled: false });
    }
    
    const { oidcConfiguration, id } = autoJoinDomain.organization;
    return res.json({
      ssoEnabled: true,
      buttonText: oidcConfiguration.buttonText || 'Login with SSO',
      organizationId: id
    });
  } catch (error) {
    console.error('Error checking OIDC status:', error);
    res.status(500).json({ error: 'Server error checking OIDC status.' });
  }
});

router.post('/verify-email', protect, async (req, res) => {
  const { token } = req.body;
  const userId = req.user.id;

  if (!token) { return res.status(400).json({ error: 'Verification token is required.' }); }

  try {
    const user = await prisma.user.findFirst({
      where: { id: userId, verificationToken: token, verificationTokenExpiresAt: { gt: new Date() } },
    });

    if (!user) { return res.status(400).json({ error: 'Invalid or expired verification token.' }); }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { emailVerified: true, verificationToken: null, verificationTokenExpiresAt: null },
    });
    
    res.json(sanitizeUser(updatedUser));
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
      data: { verificationToken, verificationTokenExpiresAt },
    });

    const loginUrl = `${process.env.WEB_URL}/login`;
    await sendEmail({
      to: user.email,
      subject: 'Verify Your Email Address',
      react: React.createElement(NewUserWelcome, {
        firstName: user.name || user.email.split('@')[0],
        loginUrl: loginUrl,
        verificationCode: verificationToken,
      })
    });
    res.json({ message: 'A new verification code has been sent.' });
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({ error: 'An error occurred while resending the verification code.' });
  }
});

router.post('/magic-link', async (req, res) => {
  const { email } = req.body;
  if (!email) { return res.status(400).json({ error: 'Email is required.' }); }

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      console.log(`Magic link requested for non-existent user: ${email}`);
      return res.status(200).json({ message: 'If an account with this email exists, a magic link has been sent.' });
    }
    await sendMagicLink(user);
    res.status(200).json({ message: 'If an account with this email exists, a magic link has been sent.' });
  } catch (error) {
    console.error('Error sending magic link:', error);
    res.status(200).json({ message: 'If an account with this email exists, a magic link has been sent.' });
  }
});

router.post('/magic-link/verify', async (req, res) => {
  const { token } = req.body;
  if (!token) { return res.status(400).json({ error: 'Token is required.' }); }

  try {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const loginToken = await prisma.loginToken.findUnique({
      where: { token: hashedToken },
      include: { user: true },
    });

    if (!loginToken || loginToken.usedAt || new Date() > loginToken.expiresAt) {
      return res.status(400).json({ error: 'Invalid, used, or expired token.' });
    }
    
    if (!loginToken.user.emailVerified) {
      await prisma.user.update({
        where: { id: loginToken.user.id },
        data: { emailVerified: true },
      });
      loginToken.user.emailVerified = true;
    }

    await prisma.loginToken.update({
      where: { id: loginToken.id },
      data: { usedAt: new Date() },
    });

    req.login(loginToken.user, (err) => {
      if (err) {
        console.error('Login after magic link error:', err);
        return res.status(500).json({ error: 'An error occurred during login.' });
      }
      return res.json(sanitizeUser(loginToken.user));
    });
  } catch (error) {
    console.error('Error verifying magic link:', error);
    res.status(500).json({ error: 'An error occurred during verification.' });
  }
});

export default router; 