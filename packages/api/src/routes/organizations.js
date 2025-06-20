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
    const { name, description, accountType, defaultCompanyId, hierarchyDisplayNames } = req.body;

    const canUpdate = await hasPermission(req.user, 'ADMIN', 'organization', id);
    if (!canUpdate) {
        return res.status(403).json({ error: 'You are not authorized to update this organization.' });
    }

    try {
        const currentOrg = await prisma.organization.findUnique({ where: { id } });
        if (!currentOrg) {
            return res.status(404).json({ error: 'Organization not found.' });
        }

        const isDowngrading = currentOrg.accountType === 'ENTERPRISE' && accountType === 'STANDARD';

        if (isDowngrading) {
            if (!defaultCompanyId) {
                return res.status(400).json({ error: 'When downgrading to Standard, a default company must be selected.' });
            }

            const company = await prisma.company.findFirst({
                where: { id: defaultCompanyId, organizationId: id }
            });
            if (!company) {
                return res.status(400).json({ error: 'The selected default company does not belong to this organization.' });
            }
            
            // Non-destructive downgrade: just update the org type and default company
            const updatedOrganization = await prisma.organization.update({
                where: { id },
                data: {
                    accountType: 'STANDARD',
                    defaultCompanyId: defaultCompanyId
                }
            });

            return res.status(200).json(updatedOrganization);
        }

        // Handle normal updates (name, description) and upgrades
        const dataToUpdate = {};
        if (name) dataToUpdate.name = name;
        if (description !== undefined) dataToUpdate.description = description;
        if (accountType) dataToUpdate.accountType = accountType;
        if (defaultCompanyId) dataToUpdate.defaultCompanyId = defaultCompanyId;
        if (hierarchyDisplayNames) dataToUpdate.hierarchyDisplayNames = hierarchyDisplayNames;

        const updatedOrganization = await prisma.organization.update({
            where: { id },
            data: dataToUpdate
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