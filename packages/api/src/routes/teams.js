import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { protect } from '../middleware/authMiddleware.js';
import { getVisibleResourceIds, hasPermission } from '../utils/permissions.js';

const prisma = new PrismaClient();
const router = Router();

// All routes in this file are protected
router.use(protect);

// GET /api/v1/teams/:id - Get a single team
router.get('/:id', async (req, res) => {
    const { id } = req.params;

    // Authorization: Check if the user has at least READER access to the team
    const canView = await hasPermission(req.user, ['ADMIN', 'EDITOR', 'READER'], 'team', id);
    if (!canView) {
        return res.status(403).json({ error: 'You are not authorized to view this team.' });
    }

    try {
        const team = await prisma.team.findUnique({
            where: { id },
        });

        if (!team) {
            return res.status(404).json({ error: 'Team not found.' });
        }

        res.status(200).json(team);

    } catch (error) {
        console.error('Get team error:', error);
        res.status(500).json({ error: 'Failed to get team.' });
    }
});

// GET /api/v1/teams - List all teams a user has access to
router.get('/', async (req, res) => {
    try {
        const visibleTeamIds = await getVisibleResourceIds(req.user, 'team');
        const teams = await prisma.team.findMany({
            where: { id: { in: visibleTeamIds } }
        });
        res.status(200).json(teams);
    } catch (error) {
        console.error('Get teams error:', error);
        res.status(500).json({ error: 'Failed to retrieve teams.' });
    }
});

// POST /api/v1/teams - Create a new team
router.post('/', async (req, res) => {
    const { name, description, companyId } = req.body;

    if (!name || !companyId) {
        return res.status(400).json({ error: 'Name and companyId are required.' });
    }

    try {
        // First, get the company to find its parent organization
        const company = await prisma.company.findUnique({
            where: { id: companyId },
            select: { organizationId: true }
        });

        if (!company) {
            return res.status(404).json({ error: 'Company not found.' });
        }

        // Authorization: User must be ADMIN/EDITOR of the company OR an ADMIN of the parent organization.
        const canCreateInCompany = await hasPermission(req.user, ['ADMIN', 'EDITOR'], 'company', companyId);
        const isOrgAdmin = await hasPermission(req.user, 'ADMIN', 'organization', company.organizationId);

        if (!canCreateInCompany && !isOrgAdmin) {
            return res.status(403).json({ error: 'You are not authorized to create a team in this company.' });
        }
    
        const newTeam = await prisma.team.create({
            data: { name, description, companyId }
        });

        // The creator automatically becomes an ADMIN of the new team.
        await prisma.membership.create({
            data: {
                userId: req.user.id,
                teamId: newTeam.id,
                role: 'ADMIN'
            }
        });

        res.status(201).json(newTeam);

    } catch (error) {
        console.error('Create team error:', error);
        res.status(500).json({ error: 'Failed to create team.' });
    }
});

// PUT /api/v1/teams/:id - Update a team
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { name, description } = req.body;

    // Authorization: User must be an ADMIN of the team to update it.
    const canUpdate = await hasPermission(req.user, 'ADMIN', 'team', id);
    if (!canUpdate) {
        return res.status(403).json({ error: 'You are not authorized to update this team.' });
    }

    try {
        const updatedTeam = await prisma.team.update({
            where: { id },
            data: { name, description }
        });
        res.status(200).json(updatedTeam);
    } catch (error) {
        console.error('Update team error:', error);
        res.status(500).json({ error: 'Failed to update team.' });
    }
});

// DELETE /api/v1/teams/:id - Delete a team
router.delete('/:id', async (req, res) => {
    const { id } = req.params;

    // Authorization: User must be an ADMIN of the team to delete it.
    const canDelete = await hasPermission(req.user, 'ADMIN', 'team', id);
    if (!canDelete) {
        return res.status(403).json({ error: 'You are not authorized to delete this team.' });
    }

    try {
        await prisma.team.delete({ where: { id } });
        res.status(204).send();
    } catch (error) {
        console.error('Delete team error:', error);
        res.status(500).json({ error: 'Failed to delete team.' });
    }
});

export default router; 