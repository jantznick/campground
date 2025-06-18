import express from 'express';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth.js';
import companyRoutes from './routes/company.js';
import teamRoutes from './routes/teams.js';
import projectRoutes from './routes/projects.js';
import hierarchyRoutes from './routes/hierarchy.js';
import organizationRoutes from './routes/organizations.js';

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cookieParser());
app.use(express.json());

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

app.listen(port, () => {
  console.log(`API server listening on port ${port}`);
}); 