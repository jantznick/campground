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

// A blocklist of common public email domains to prevent them from being registered for auto-join.
const PUBLIC_DOMAINS = new Set(['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com', 'icloud.com', 'msn.com']);

// --- Auto-Join Domain Management for Organizations ---

// GET /api/v1/organizations/:id/domains - Get all auto-join domains for an organization
router.get('/:id/domains', async (req, res) => {
    const { id } = req.params;

    const canManage = await hasPermission(req.user, 'ADMIN', 'organization', id);
    if (!canManage) {
        return res.status(403).json({ error: 'You are not authorized to manage domains for this organization.' });
    }

    try {
        const domains = await prisma.autoJoinDomain.findMany({
            where: { organizationId: id },
            orderBy: { createdAt: 'asc' }
        });
        res.status(200).json(domains);
    } catch (error) {
        console.error('Get domains error:', error);
        res.status(500).json({ error: 'Failed to retrieve domains.' });
    }
});

// POST /api/v1/organizations/:id/domains - Add a new auto-join domain
router.post('/:id/domains', async (req, res) => {
    const { id } = req.params;
    const { domain, role } = req.body;

    if (!domain || !role) {
        return res.status(400).json({ error: 'Domain and role are required.' });
    }
    
    if (PUBLIC_DOMAINS.has(domain.toLowerCase())) {
        return res.status(400).json({ error: 'Public email domains cannot be used for auto-join.' });
    }

    const canManage = await hasPermission(req.user, 'ADMIN', 'organization', id);
    if (!canManage) {
        return res.status(403).json({ error: 'You are not authorized to manage domains for this organization.' });
    }

    try {
        // Verify the organization exists
        const organization = await prisma.organization.findUnique({ where: { id } });
        if (!organization) {
            return res.status(404).json({ error: 'Organization not found.' });
        }

        const newDomain = await prisma.autoJoinDomain.create({
            data: {
                domain: domain.toLowerCase(),
                role,
                organizationId: id
            }
        });
        res.status(201).json(newDomain);
    } catch (error) {
        if (error.code === 'P2002') { // Unique constraint violation
            return res.status(409).json({ error: 'This domain has already been added to this organization.' });
        }
        console.error('Add domain error:', error);
        res.status(500).json({ error: 'Failed to add domain.' });
    }
});

// DELETE /api/v1/organizations/:id/domains/:domainMappingId - Remove an auto-join domain
router.delete('/:id/domains/:domainMappingId', async (req, res) => {
    const { id: organizationId, domainMappingId } = req.params;

    const canManage = await hasPermission(req.user, 'ADMIN', 'organization', organizationId);
    if (!canManage) {
        return res.status(403).json({ error: 'You are not authorized to manage domains for this organization.' });
    }

    try {
        // Ensure the domain mapping belongs to the specified organization before deleting
        const domainMapping = await prisma.autoJoinDomain.findFirst({
            where: { id: domainMappingId, organizationId }
        });

        if (!domainMapping) {
            return res.status(404).json({ error: 'Domain mapping not found or does not belong to this organization.' });
        }
        
        await prisma.autoJoinDomain.delete({
            where: { id: domainMappingId }
        });

        res.status(204).send();
    } catch (error) {
        console.error('Delete domain error:', error);
        res.status(500).json({ error: 'Failed to delete domain.' });
    }
});

// NOTE: GET, POST, DELETE routes for organizations might be needed.
// For now, only implementing the PUT route as requested.
// GET all for a user is handled by the hierarchy route.
// POST for a new org might be a super-admin function or a different flow.
// DELETE is a sensitive operation and needs careful consideration of what happens to child resources.

export default router; 