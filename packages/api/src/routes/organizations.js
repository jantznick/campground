import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { protect } from '../middleware/authMiddleware.js';
import { hasPermission } from '../utils/permissions.js';

const prisma = new PrismaClient();
const router = Router();

// All routes in this file are protected
router.use(protect);

// GET /api/v1/organizations/:id - Get a single organization
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    
    // Authorization: Check if the user has at least READER access to the organization
    const canView = await hasPermission(req.user, ['ADMIN', 'EDITOR', 'READER'], 'organization', id);
    if (!canView) {
        return res.status(403).json({ error: 'You are not authorized to view this organization.' });
    }

    try {
        const organization = await prisma.organization.findUnique({
            where: { id },
        });

        if (!organization) {
            return res.status(404).json({ error: 'Organization not found.' });
        }

        res.status(200).json(organization);

    } catch (error) {
        console.error('Get organization error:', error);
        res.status(500).json({ error: 'Failed to get organization.' });
    }
});

// PUT /api/v1/organizations/:id - Update an organization
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { name, description } = req.body;
    
    // Authorization: Check if the user is an ADMIN of the organization
    const canUpdate = await hasPermission(req.user, 'ADMIN', 'organization', id);
    if (!canUpdate) {
        return res.status(403).json({ error: 'You are not authorized to update this organization.' });
    }

    try {
        const updatedOrganization = await prisma.organization.update({
            where: { id },
            data: { name, description }
        });

        res.status(200).json(updatedOrganization);

    } catch (error) {
        console.error('Update organization error:', error);
        res.status(500).json({ error: 'Failed to update organization.' });
    }
});

// NOTE: GET, POST, DELETE routes for organizations might be needed.
// For now, only implementing the PUT route as requested.
// GET all for a user is handled by the hierarchy route.
// POST for a new org might be a super-admin function or a different flow.
// DELETE is a sensitive operation and needs careful consideration of what happens to child resources.

export default router; 