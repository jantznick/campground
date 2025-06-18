import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { protect } from '../middleware/authMiddleware.js';
import { getVisibleResourceIds } from '../utils/permissions.js';

const prisma = new PrismaClient();
const router = Router();

router.use(protect);

router.get('/', async (req, res) => {
    try {
        const user = req.user;

        const [
            visibleOrgIds, 
            visibleCompanyIds, 
            visibleTeamIds, 
            visibleProjectIds
        ] = await Promise.all([
            getVisibleResourceIds(user, 'organization'),
            getVisibleResourceIds(user, 'company'),
            getVisibleResourceIds(user, 'team'),
            getVisibleResourceIds(user, 'project')
        ]);

        const [orgs, companies, teams, projects] = await Promise.all([
            prisma.organization.findMany({ where: { id: { in: visibleOrgIds } } }),
            prisma.company.findMany({ where: { id: { in: visibleCompanyIds } } }),
            prisma.team.findMany({ where: { id: { in: visibleTeamIds } } }),
            prisma.project.findMany({ where: { id: { in: visibleProjectIds } } })
        ]);

        const projectMap = new Map(projects.map(p => [p.id, { ...p, type: 'project' }]));
        const teamMap = new Map(teams.map(t => [t.id, { ...t, type: 'team', projects: [] }]));
        const companyMap = new Map(companies.map(c => [c.id, { ...c, type: 'company', teams: [] }]));
        const orgMap = new Map(orgs.map(o => [o.id, { ...o, type: 'organization', companies: [] }]));

        projects.forEach(p => {
            if (p.teamId && teamMap.has(p.teamId)) {
                teamMap.get(p.teamId).projects.push(projectMap.get(p.id));
            }
        });

        teams.forEach(t => {
            if (t.companyId && companyMap.has(t.companyId)) {
                companyMap.get(t.companyId).teams.push(teamMap.get(t.id));
            }
        });

        companies.forEach(c => {
            if (c.organizationId && orgMap.has(c.organizationId)) {
                orgMap.get(c.organizationId).companies.push(companyMap.get(c.id));
            }
        });
        
        const hierarchy = Array.from(orgMap.values());
        
        res.status(200).json(hierarchy);

    } catch (error) {
        console.error('Get hierarchy error:', error);
        res.status(500).json({ error: 'Failed to retrieve hierarchy.' });
    }
});

export default router; 