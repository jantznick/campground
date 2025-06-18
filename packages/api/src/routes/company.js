import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { protect } from '../middleware/authMiddleware.js';
import { getVisibleResourceIds, hasPermission } from '../utils/permissions.js';

const prisma = new PrismaClient();
const router = Router();

// All routes in this file are protected
router.use(protect);

// GET /api/v1/companies/:id - Get a single company
router.get('/:id', async (req, res) => {
    const { id } = req.params;

    // Authorization: Check if the user has at least READER access to the company
    const canView = await hasPermission(req.user, ['ADMIN', 'EDITOR', 'READER'], 'company', id);
    if (!canView) {
        return res.status(403).json({ error: 'You are not authorized to view this company.' });
    }

    try {
        const company = await prisma.company.findUnique({
            where: { id },
        });

        if (!company) {
            return res.status(404).json({ error: 'Company not found.' });
        }

        res.status(200).json(company);

    } catch (error) {
        console.error('Get company error:', error);
        res.status(500).json({ error: 'Failed to get company.' });
    }
});

// GET /api/v1/companies - List all companies a user has access to
router.get('/', async (req, res) => {
    try {
        const visibleCompanyIds = await getVisibleResourceIds(req.user, 'company');
        const companies = await prisma.company.findMany({
            where: { id: { in: visibleCompanyIds } }
        });
        res.status(200).json(companies);
    } catch (error) {
        console.error('Get companies error:', error);
        res.status(500).json({ error: 'Failed to retrieve companies.' });
    }
});

// POST /api/v1/companies - Create a new company
router.post('/', async (req, res) => {
    const { name, description, organizationId } = req.body;
    
    if (!name || !organizationId) {
        return res.status(400).json({ error: 'Name and organizationId are required.' });
    }

    // Authorization: Check if the user is an ADMIN of the organization.
    const canCreate = await hasPermission(req.user, 'ADMIN', 'organization', organizationId);
    if (!canCreate) {
        return res.status(403).json({ error: 'You are not authorized to create a company in this organization.' });
    }

    try {
        // Create the new company
        const newCompany = await prisma.company.create({
            data: {
                name,
                description,
                organizationId,
            }
        });

        res.status(201).json(newCompany);

    } catch (error) {
        // Handle potential errors, e.g., if the organizationId doesn't exist
        if (error.code === 'P2003') { // Foreign key constraint failed
             return res.status(400).json({ error: 'The specified organization does not exist.' });
        }
        console.error('Create company error:', error);
        res.status(500).json({ error: 'Failed to create company.' });
    }
});

// PUT /api/v1/companies/:id - Update a company
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { name, description } = req.body;
    
    // Authorization: Check if the user is an ADMIN of the company
    const canUpdate = await hasPermission(req.user, 'ADMIN', 'company', id);
    if (!canUpdate) {
        return res.status(403).json({ error: 'You are not authorized to update this company.' });
    }

    try {
        const updatedCompany = await prisma.company.update({
            where: { id },
            data: { name, description }
        });

        res.status(200).json(updatedCompany);

    } catch (error) {
        console.error('Update company error:', error);
        res.status(500).json({ error: 'Failed to update company.' });
    }
});

// DELETE /api/v1/companies/:id - Delete a company
router.delete('/:id', async (req, res) => {
    const { id } = req.params;

    // Authorization: Check if the user is an ADMIN of the company
    const canDelete = await hasPermission(req.user, 'ADMIN', 'company', id);
    if (!canDelete) {
        return res.status(403).json({ error: 'You are not authorized to delete this company.' });
    }
    
    try {
        await prisma.company.delete({ where: { id } });

        res.status(204).send();

    } catch (error) {
        console.error('Delete company error:', error);
        res.status(500).json({ error: 'Failed to delete company.' });
    }
});

export default router; 