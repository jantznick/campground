import express from 'express';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import passport from 'passport';
import { PrismaSessionStore } from '@quixo3/prisma-session-store';
import { PrismaClient } from '@prisma/client';
import configurePassport from './utils/passport.js';
import authRoutes from './routes/auth.js';
import companyRoutes from './routes/company.js';
import teamRoutes from './routes/teams.js';
import projectRoutes from './routes/projects.js';
import hierarchyRoutes from './routes/hierarchy.js';
import organizationRoutes from './routes/organizations.js';
import membershipRoutes from './routes/memberships.js';
import invitationRoutes from './routes/invitations.js';
import oidcRoutes from './routes/oidc.js';

const app = express();
const port = process.env.PORT || 3001;
const prisma = new PrismaClient();

// Configure and initialize passport
configurePassport();

// Middleware
app.use(cookieParser());
app.use(express.json());

// Session middleware
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'a-very-strong-secret-in-development',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
    },
    store: new PrismaSessionStore(prisma, {
      checkPeriod: 2 * 60 * 1000, //ms
      dbRecordIdIsSessionId: true,
      dbRecordIdFunction: undefined,
    }),
  })
);

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

app.get('/api/v1/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Auth routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/companies', companyRoutes);
app.use('/api/v1/teams', teamRoutes);
app.use('/api/v1/projects', projectRoutes);
app.use('/api/v1/hierarchy', hierarchyRoutes);
app.use('/api/v1/organizations', organizationRoutes);
app.use('/api/v1/memberships', membershipRoutes);
app.use('/api/v1/invitations', invitationRoutes);
app.use('/api/v1', oidcRoutes);

app.listen(port, () => {
  console.log(`API server listening on port ${port}`);
}); 