import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Finds all ancestor resources for a given starting resource.
 * @param {string} resourceType - The type of the resource (company, team, project).
 * @param {string} resourceId - The ID of the resource.
 * @returns {Promise<Object>} An object containing the IDs of the ancestors (organizationId, companyId, teamId).
 */
export async function getAncestors(resourceType, resourceId) {
    const ancestors = {
        organizationId: null,
        companyId: null,
        teamId: null,
    };

    if (resourceType === 'project') {
        const project = await prisma.project.findUnique({
            where: { id: resourceId },
            select: { teamId: true, team: { select: { companyId: true, company: { select: { organizationId: true } } } } },
        });
        if (project) {
            ancestors.teamId = project.teamId;
            ancestors.companyId = project.team.companyId;
            ancestors.organizationId = project.team.company.organizationId;
        }
    } else if (resourceType === 'team') {
        const team = await prisma.team.findUnique({
            where: { id: resourceId },
            select: { companyId: true, company: { select: { organizationId: true } } },
        });
        if (team) {
            ancestors.companyId = team.companyId;
            ancestors.organizationId = team.company.organizationId;
        }
    } else if (resourceType === 'company') {
        const company = await prisma.company.findUnique({
            where: { id: resourceId },
            select: { organizationId: true },
        });
        if (company) {
            ancestors.organizationId = company.organizationId;
        }
    }

    return ancestors;
}

/**
 * Finds all descendant resource IDs for a given starting resource.
 * @param {string} resourceType - The type of the resource (organization, company, team).
 * @param {string} resourceId - The ID of the resource.
 * @returns {Promise<Object>} An object containing arrays of descendant IDs (companyIds, teamIds, projectIds).
 */
export async function getDescendants(resourceType, resourceId) {
    const descendants = {
        companyIds: [],
        teamIds: [],
        projectIds: [],
    };

    if (resourceType === 'organization') {
        const companies = await prisma.company.findMany({ where: { organizationId: resourceId }, select: { id: true } });
        descendants.companyIds = companies.map(c => c.id);
        resourceType = 'company'; // Cascade to get teams and projects
        resourceId = descendants.companyIds;
    }

    if (resourceType === 'company') {
        const companyIds = Array.isArray(resourceId) ? resourceId : [resourceId];
        const teams = await prisma.team.findMany({ where: { companyId: { in: companyIds } }, select: { id: true } });
        descendants.teamIds = teams.map(t => t.id);
        resourceType = 'team'; // Cascade to get projects
        resourceId = descendants.teamIds;
    }

    if (resourceType === 'team') {
        const teamIds = Array.isArray(resourceId) ? resourceId : [resourceId];
        if (teamIds.length > 0) {
            const projects = await prisma.project.findMany({ where: { teamId: { in: teamIds } }, select: { id: true } });
            descendants.projectIds = projects.map(p => p.id);
        }
    }

    return descendants;
} 