import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { protect } from '../middleware/authMiddleware.js';
import { getVisibleResourceIds, hasPermission } from '../utils/permissions.js';

const prisma = new PrismaClient();
const router = Router();

// All routes in this file are protected
router.use(protect);

// GET /api/v1/projects/:id - Get a single project
router.get('/:id', async (req, res) => {
    const { id } = req.params;

    // Authorization: Check if the user has at least READER access to the project
    const canView = await hasPermission(req.user, ['ADMIN', 'EDITOR', 'READER'], 'project', id);
    if (!canView) {
        return res.status(403).json({ error: 'You are not authorized to view this project.' });
    }

    try {
        const project = await prisma.project.findUnique({
            where: { id },
        });

        if (!project) {
            return res.status(404).json({ error: 'Project not found.' });
        }

        res.status(200).json(project);

    } catch (error) {
        console.error('Get project error:', error);
        res.status(500).json({ error: 'Failed to get project.' });
    }
});

// GET /api/v1/projects - List all projects a user has access to
router.get('/', async (req, res) => {
    try {
        const visibleProjectIds = await getVisibleResourceIds(req.user, 'project');
        const projects = await prisma.project.findMany({
            where: { id: { in: visibleProjectIds } }
        });
        res.status(200).json(projects);
    } catch (error) {
        console.error('Get projects error:', error);
        res.status(500).json({ error: 'Failed to retrieve projects.' });
    }
});

// POST /api/v1/projects - Create a new project
router.post('/', async (req, res) => {
    const { name, description, teamId } = req.body;

    if (!name || !teamId) {
        return res.status(400).json({ error: 'Name and teamId are required.' });
    }

    // Authorization: User must be ADMIN or EDITOR of the parent team.
    const canCreate = await hasPermission(req.user, ['ADMIN', 'EDITOR'], 'team', teamId);
    if (!canCreate) {
        return res.status(403).json({ error: 'You are not authorized to create a project in this team.' });
    }
    
    try {
        const newProject = await prisma.project.create({
            data: { name, description, teamId }
        });

        // The creator automatically becomes an ADMIN of the new project.
        await prisma.membership.create({
            data: {
                userId: req.user.id,
                projectId: newProject.id,
                role: 'ADMIN'
            }
        });

        res.status(201).json(newProject);

    } catch (error) {
        console.error('Create project error:', error);
        res.status(500).json({ error: 'Failed to create project.' });
    }
});

// PUT /api/v1/projects/:id - Update a project
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { name, description } = req.body;

    // Authorization: User must be an ADMIN of the project to update it.
    const canUpdate = await hasPermission(req.user, 'ADMIN', 'project', id);
    if (!canUpdate) {
        return res.status(403).json({ error: 'You are not authorized to update this project.' });
    }

    try {
        const updatedProject = await prisma.project.update({
            where: { id },
            data: { name, description }
        });
        res.status(200).json(updatedProject);
    } catch (error) {
        console.error('Update project error:', error);
        res.status(500).json({ error: 'Failed to update project.' });
    }
});

// DELETE /api/v1/projects/:id - Delete a project
router.delete('/:id', async (req, res) => {
    const { id } = req.params;

    // Authorization: User must be an ADMIN of the project to delete it.
    const canDelete = await hasPermission(req.user, 'ADMIN', 'project', id);
    if (!canDelete) {
        return res.status(403).json({ error: 'You are not authorized to delete this project.' });
    }

    try {
        await prisma.project.delete({ where: { id } });
        res.status(204).send();
    } catch (error) {
        console.error('Delete project error:', error);
        res.status(500).json({ error: 'Failed to delete project.' });
    }
});


export default router; 