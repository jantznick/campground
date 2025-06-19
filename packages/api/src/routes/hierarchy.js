import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { protect } from '../middleware/authMiddleware.js';

const prisma = new PrismaClient();
const router = Router();

router.use(protect);

router.get('/', async (req, res) => {
    try {
        const user = req.user;

        // 1. Fetch all of the user's direct memberships with roles
        const memberships = await prisma.membership.findMany({
            where: { userId: user.id },
            select: {
                role: true,
                organizationId: true,
                companyId: true,
                teamId: true,
                projectId: true,
            }
        });

        // 2. Get IDs for direct memberships
        const directOrgIds = new Set(memberships.map(m => m.organizationId).filter(Boolean));
        const directCompanyIds = new Set(memberships.map(m => m.companyId).filter(Boolean));
        const directTeamIds = new Set(memberships.map(m => m.teamId).filter(Boolean));
        const directProjectIds = new Set(memberships.map(m => m.projectId).filter(Boolean));

        // 3. Get IDs of all items where user has an ADMIN role & all their descendants
        const adminOrgIds = memberships.filter(m => m.role === 'ADMIN').map(m => m.organizationId).filter(Boolean);
        const adminCompanyIds = memberships.filter(m => m.role === 'ADMIN').map(m => m.companyId).filter(Boolean);
        const adminTeamIds = memberships.filter(m => m.role === 'ADMIN').map(m => m.teamId).filter(Boolean);
        
        // Projects from teams the user is a direct member of
        const projectsInDirectTeams = new Set();
        if (directTeamIds.size > 0) {
            const projects = await prisma.project.findMany({ where: { teamId: { in: [...directTeamIds] } }, select: { id: true } });
            projects.forEach(p => projectsInDirectTeams.add(p.id));
        }

        const descendantCompanyIds = new Set();
        if (adminOrgIds.length > 0) {
            const companies = await prisma.company.findMany({ where: { organizationId: { in: adminOrgIds } }, select: { id: true } });
            companies.forEach(c => descendantCompanyIds.add(c.id));
        }

        const descendantTeamIds = new Set();
        const companyIdsForTeamSearch = [...new Set([...adminCompanyIds, ...descendantCompanyIds])];
        if (companyIdsForTeamSearch.length > 0) {
            const teams = await prisma.team.findMany({ where: { companyId: { in: companyIdsForTeamSearch } }, select: { id: true } });
            teams.forEach(t => descendantTeamIds.add(t.id));
        }

        const descendantProjectIds = new Set();
        const teamIdsForProjectSearch = [...new Set([...adminTeamIds, ...descendantTeamIds])];
        if (teamIdsForProjectSearch.length > 0) {
            const projects = await prisma.project.findMany({ where: { teamId: { in: teamIdsForProjectSearch } }, select: { id: true } });
            projects.forEach(p => descendantProjectIds.add(p.id));
        }

        // 4. For non-admin memberships, fetch parent items for context
        const ancestorTeamIds = new Set();
        const projects = await prisma.project.findMany({ where: { id: { in: [...directProjectIds] } }, select: { teamId: true } });
        projects.forEach(p => p.teamId && ancestorTeamIds.add(p.teamId));
        
        const ancestorCompanyIds = new Set();
        const teams = await prisma.team.findMany({ where: { id: { in: [...directTeamIds, ...ancestorTeamIds] } }, select: { companyId: true } });
        teams.forEach(t => t.companyId && ancestorCompanyIds.add(t.companyId));
        
        const ancestorOrgIds = new Set();
        const companies = await prisma.company.findMany({ where: { id: { in: [...directCompanyIds, ...ancestorCompanyIds] } }, select: { organizationId: true } });
        companies.forEach(c => c.organizationId && ancestorOrgIds.add(c.organizationId));

        // 5. Combine all IDs to get the full list of resources to fetch
        const allOrgIds = [...new Set([...directOrgIds, ...ancestorOrgIds, ...adminOrgIds])];
        const allCompanyIds = [...new Set([...directCompanyIds, ...ancestorCompanyIds, ...adminCompanyIds, ...descendantCompanyIds])];
        const allTeamIds = [...new Set([...directTeamIds, ...ancestorTeamIds, ...adminTeamIds, ...descendantTeamIds])];
        const allProjectIds = [...new Set([...directProjectIds, ...descendantProjectIds, ...projectsInDirectTeams])];

        // 6. Fetch all the necessary resource models from the database
        const [allOrgs, allCompanies, allTeams, allProjects] = await Promise.all([
            prisma.organization.findMany({ where: { id: { in: allOrgIds } } }),
            prisma.company.findMany({ where: { id: { in: allCompanyIds } } }),
            prisma.team.findMany({ where: { id: { in: allTeamIds } } }),
            prisma.project.findMany({ where: { id: { in: allProjectIds } } })
        ]);

        // 7. Build the hierarchy tree from the fetched resources
        const projectMap = new Map(allProjects.map(p => [p.id, { ...p, type: 'project' }]));
        
        const teamMap = new Map(allTeams.map(t => {
            const projects = allProjects.filter(p => p.teamId === t.id);
            return [t.id, { ...t, type: 'team', projects: projects.map(p => projectMap.get(p.id)).filter(Boolean) }];
        }));

        const companyMap = new Map(allCompanies.map(c => {
            const teams = allTeams.filter(t => t.companyId === c.id);
            return [c.id, { ...c, type: 'company', teams: teams.map(t => teamMap.get(t.id)).filter(Boolean) }];
        }));

        let hierarchy = allOrgs.map(o => {
            let companies = allCompanies.filter(c => c.organizationId === o.id);
            
            // For STANDARD orgs, if the user is not an admin of the org, only show the default company they might have access to.
            if (o.accountType === 'STANDARD' && o.defaultCompanyId && !adminOrgIds.includes(o.id)) {
                companies = companies.filter(c => c.id === o.defaultCompanyId);
            }

            return { ...o, type: 'organization', companies: companies.map(c => companyMap.get(c.id)).filter(Boolean) };
        });

        res.status(200).json(hierarchy);

    } catch (error) {
        console.error('Get hierarchy error:', error);
        res.status(500).json({ error: 'Failed to retrieve hierarchy.' });
    }
});

export default router; 