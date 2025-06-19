import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { protect } from '../middleware/authMiddleware.js';

const prisma = new PrismaClient();
const router = Router();

router.use(protect);

router.get('/', async (req, res) => {
    try {
        const user = req.user;

        // 1. Fetch all of the user's DIRECT memberships. These are the source of truth for permissions.
        const memberships = await prisma.membership.findMany({
            where: { userId: user.id },
            select: {
                organizationId: true,
                companyId: true,
                teamId: true,
                projectId: true,
            }
        });

        const directOrgIds = new Set(memberships.map(m => m.organizationId).filter(Boolean));
        const directCompanyIds = new Set(memberships.map(m => m.companyId).filter(Boolean));
        const directTeamIds = new Set(memberships.map(m => m.teamId).filter(Boolean));
        const directProjectIds = new Set(memberships.map(m => m.projectId).filter(Boolean));

        // 2. Fetch all DESCENDANTS of direct memberships. Any membership grants downward visibility.
        const descendantCompanyIds = new Set();
        if (directOrgIds.size > 0) {
            const companies = await prisma.company.findMany({ where: { organizationId: { in: [...directOrgIds] } }, select: { id: true } });
            companies.forEach(c => descendantCompanyIds.add(c.id));
        }

        const descendantTeamIds = new Set();
        const companyIdsForTeamSearch = [...new Set([...directCompanyIds, ...descendantCompanyIds])];
        if (companyIdsForTeamSearch.length > 0) {
            const teams = await prisma.team.findMany({ where: { companyId: { in: companyIdsForTeamSearch } }, select: { id: true } });
            teams.forEach(t => descendantTeamIds.add(t.id));
        }

        const descendantProjectIds = new Set();
        const teamIdsForProjectSearch = [...new Set([...directTeamIds, ...descendantTeamIds])];
        if (teamIdsForProjectSearch.length > 0) {
            const projects = await prisma.project.findMany({ where: { teamId: { in: teamIdsForProjectSearch } }, select: { id: true } });
            projects.forEach(p => descendantProjectIds.add(p.id));
        }

        // 3. This gives us the complete set of items the user has permission to see/access.
        const accessibleProjectIds = new Set([...directProjectIds, ...descendantProjectIds]);
        const accessibleTeamIds = new Set([...directTeamIds, ...descendantTeamIds]);
        const accessibleCompanyIds = new Set([...directCompanyIds, ...descendantCompanyIds]);
        const accessibleOrgIds = new Set(directOrgIds);

        // 4. Fetch ANCESTORS of all accessible items purely for UI context.
        // These do NOT grant permissions, they just build the tree structure.
        const ancestorTeamIds = new Set();
        if (accessibleProjectIds.size > 0) {
            const projects = await prisma.project.findMany({ where: { id: { in: [...accessibleProjectIds] } }, select: { teamId: true } });
            projects.forEach(p => p.teamId && ancestorTeamIds.add(p.teamId));
        }

        const ancestorCompanyIds = new Set();
        const teamsForCompanySearch = [...new Set([...accessibleTeamIds, ...ancestorTeamIds])];
        if (teamsForCompanySearch.length > 0) {
            const teams = await prisma.team.findMany({ where: { id: { in: teamsForCompanySearch } }, select: { companyId: true } });
            teams.forEach(t => t.companyId && ancestorCompanyIds.add(t.companyId));
        }
        
        const ancestorOrgIds = new Set();
        const companiesForOrgSearch = [...new Set([...accessibleCompanyIds, ...ancestorCompanyIds])];
        if (companiesForOrgSearch.length > 0) {
            const companies = await prisma.company.findMany({ where: { id: { in: companiesForOrgSearch } }, select: { organizationId: true } });
            companies.forEach(c => c.organizationId && ancestorOrgIds.add(c.organizationId));
        }

        // 5. Combine ACCESSIBLE and ANCESTOR IDs to get the final list of all models to fetch from the DB.
        const finalOrgIds = [...new Set([...accessibleOrgIds, ...ancestorOrgIds])];
        const finalCompanyIds = [...new Set([...accessibleCompanyIds, ...ancestorCompanyIds])];
        const finalTeamIds = [...new Set([...accessibleTeamIds, ...ancestorTeamIds])];
        const finalProjectIds = [...accessibleProjectIds];
        
        // 6. Fetch all the necessary data in one batch.
        const [allOrgs, allCompanies, allTeams, allProjects] = await Promise.all([
            prisma.organization.findMany({ where: { id: { in: finalOrgIds } } }),
            prisma.company.findMany({ where: { id: { in: finalCompanyIds } } }),
            prisma.team.findMany({ where: { id: { in: finalTeamIds } } }),
            prisma.project.findMany({ where: { id: { in: finalProjectIds } } })
        ]);

        // 7. Build the final hierarchy. Because we only fetched exactly what's needed,
        // this process automatically excludes any items (like sibling teams) the user shouldn't see.
        const projectMap = new Map(allProjects.map(p => [p.id, { ...p, type: 'project' }]));
        
        const teamMap = new Map(allTeams.map(t => {
            const projects = allProjects.filter(p => p.teamId === t.id);
            return [t.id, { ...t, type: 'team', projects: projects.map(p => projectMap.get(p.id)).filter(Boolean) }];
        }));

        const companyMap = new Map(allCompanies.map(c => {
            const teams = allTeams.filter(t => t.companyId === c.id);
            return [c.id, { ...c, type: 'company', teams: teams.map(t => teamMap.get(t.id)).filter(Boolean) }];
        }));

        const hierarchy = allOrgs.map(o => {
            const companies = allCompanies.filter(c => c.organizationId === o.id);
            return { ...o, type: 'organization', companies: companies.map(c => companyMap.get(c.id)).filter(Boolean) };
        });

        res.status(200).json(hierarchy);

    } catch (error) {
        console.error('Get hierarchy error:', error);
        res.status(500).json({ error: 'Failed to retrieve hierarchy.' });
    }
});

export default router; 