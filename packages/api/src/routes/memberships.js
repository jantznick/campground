import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { protect } from '../middleware/authMiddleware.js';
import { hasPermission } from '../utils/permissions.js';
import crypto from 'crypto';
import { getAncestors, getDescendants } from '../utils/hierarchy.js';

const prisma = new PrismaClient();
const router = Router();

router.use(protect);

// Get members for a resource with effective permissions
router.get('/', async (req, res) => {
    const { organizationId, companyId, teamId, projectId } = req.query;

    try {
        let resourceType, resourceId;

        if (organizationId) {
            resourceType = 'organization';
            resourceId = organizationId;
        } else if (companyId) {
            resourceType = 'company';
            resourceId = companyId;
        } else if (teamId) {
            resourceType = 'team';
            resourceId = teamId;
        } else if (projectId) {
            resourceType = 'project';
            resourceId = projectId;
        } else {
            return res.status(400).json({ error: 'A resource ID must be provided.' });
        }

        // Authorization Check: Ensure the requesting user can view the requested resource.
        const canView = await hasPermission(req.user, ['ADMIN', 'EDITOR', 'READER'], resourceType, resourceId);
        if (!canView) {
            return res.status(403).json({ error: 'You are not authorized to view members of this resource.' });
        }

        // 1. Get the full resource tree (ancestors and descendants)
        const ancestors = await getAncestors(resourceType, resourceId);
        const descendants = await getDescendants(resourceType, resourceId);

        const resourceTreeIds = {
            organizationIds: [ancestors.organizationId, resourceType === 'organization' ? resourceId : null].filter(Boolean),
            companyIds: [ancestors.companyId, resourceType === 'company' ? resourceId : null, ...descendants.companyIds].filter(Boolean),
            teamIds: [ancestors.teamId, resourceType === 'team' ? resourceId : null, ...descendants.teamIds].filter(Boolean),
            projectIds: [resourceType === 'project' ? resourceId : null, ...descendants.projectIds].filter(Boolean),
        };

        // 2. Gather all memberships related to the tree
        const allMemberships = await prisma.membership.findMany({
            where: {
                OR: [
                    { organizationId: { in: resourceTreeIds.organizationIds } },
                    { companyId: { in: resourceTreeIds.companyIds } },
                    { teamId: { in: resourceTreeIds.teamIds } },
                    { projectId: { in: resourceTreeIds.projectIds } },
                ],
            },
            include: {
                user: {
                    select: { id: true, email: true, password: true },
                },
            },
        });

        // 3. Calculate "Effective Role" for each user
        const effectiveMembers = new Map();

        for (const m of allMemberships) {
            if (!m.user) continue;

            const userId = m.user.id;
            let currentUserData = effectiveMembers.get(userId);
            if (!currentUserData) {
                effectiveMembers.set(userId, {
                    user: {
                        id: m.user.id,
                        email: m.user.email,
                        status: m.user.password ? 'ACTIVE' : 'PENDING',
                    },
                    effectiveRole: 'VIEWER', // Default to viewer
                    roleSource: 'viewer',
                    roleSourceType: null,
                    roleSourceId: null,
                });
                currentUserData = effectiveMembers.get(userId);
            }

            let role, source, sourceType, sourceId;

            // Determine role and source from this specific membership
            if (m.organizationId) { role = m.role; source = 'organization'; sourceId = m.organizationId; }
            else if (m.companyId) { role = m.role; source = 'company'; sourceId = m.companyId; }
            else if (m.teamId) { role = m.role; source = 'team'; sourceId = m.teamId; }
            else if (m.projectId) { role = m.role; source = 'project'; sourceId = m.projectId; }

            // Determine if this membership is direct, an ancestor, or a descendant
            const isDirect = sourceId === resourceId;
            const isAncestor = ancestors[`${source}Id`] === sourceId;

            let newEffectiveRole = null;
            let newRoleSource = '';
            
            // Rule 1: Direct membership is king
            if (isDirect) {
                newEffectiveRole = role;
                newRoleSource = `Direct membership on this ${source}`;
            }
            // Rule 2: Inherited Admin
            else if (isAncestor && role === 'ADMIN') {
                newEffectiveRole = 'ADMIN';
                newRoleSource = `Admin of parent ${source}`;
            }
            // Rule 3: Viewer (default)
            else {
                 newRoleSource = `Member of related ${source}`;
            }

            // --- Precedence Logic ---
            // Direct roles always win.
            if (isDirect) {
                currentUserData.effectiveRole = newEffectiveRole;
                currentUserData.roleSource = newRoleSource;
                currentUserData.roleSourceType = source;
                currentUserData.roleSourceId = sourceId;
            }
            // Inherited Admin wins over Viewer.
            else if (newEffectiveRole === 'ADMIN' && currentUserData.effectiveRole !== 'ADMIN') {
                currentUserData.effectiveRole = 'ADMIN';
                currentUserData.roleSource = newRoleSource;
                currentUserData.roleSourceType = source;
                currentUserData.roleSourceId = sourceId;
            }
             // Set viewer source if nothing higher has been set
            else if (currentUserData.effectiveRole === 'VIEWER' && currentUserData.roleSource === 'viewer') {
                currentUserData.roleSource = newRoleSource;
                currentUserData.roleSourceType = source;
                currentUserData.roleSourceId = sourceId;
            }
        }

        res.json(Array.from(effectiveMembers.values()));

    } catch (error) {
        console.error(`Error fetching members for ${Object.keys(req.query)[0]}:`, error);
        res.status(500).json({ error: 'An error occurred while fetching members.' });
    }
});

// Add a member to a resource
router.post('/', async (req, res) => {
    const { email, role, resourceId, resourceType } = req.body;
    
    if (!email || !role || !resourceId || !resourceType) {
        return res.status(400).json({ error: 'Email, role, resourceId, and resourceType are required.' });
    }
    
    const canManage = await hasPermission(req.user, 'ADMIN', resourceType, resourceId);
    if (!canManage) {
        return res.status(403).json({ error: 'You are not authorized to add members to this resource.' });
    }

    try {
        let user = await prisma.user.findUnique({ where: { email } });
        let invitationLink = null;

        // If user does not exist, create them in a pending state and generate an invitation
        if (!user) {
            const invitationToken = crypto.randomBytes(32).toString('hex');
            const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

            user = await prisma.user.create({
                data: {
                    email,
                    invitation: {
                        create: {
                            email,
                            token: invitationToken,
                            expires,
                        },
                    },
                },
            });
            
            // Note: In a real app, you'd use a frontend URL from an environment variable.
            invitationLink = `http://localhost:3000/register?invite_token=${invitationToken}`;
        }

        const existingMembership = await prisma.membership.findFirst({
            where: {
                userId: user.id,
                [`${resourceType}Id`]: resourceId,
            },
        });

        if (existingMembership) {
            return res.status(409).json({ error: 'User is already a member of this resource.' });
        }

        // --- START: Grant implicit parent access logic ---
        const parentMembershipsToCreate = [];
        const existingParentMemberships = [];

        // Find all existing memberships for this user to avoid creating duplicates
        const allUserMemberships = await prisma.membership.findMany({
            where: { userId: user.id }
        });
        const existingOrgs = allUserMemberships.filter(m => m.organizationId).map(m => m.organizationId);
        const existingComps = allUserMemberships.filter(m => m.companyId).map(m => m.companyId);
        const existingTeams = allUserMemberships.filter(m => m.teamId).map(m => m.teamId);

        let currentItem = { type: resourceType, id: resourceId };
        
        try {
            if (currentItem.type === 'project') {
                const project = await prisma.project.findUnique({ where: { id: currentItem.id }, select: { teamId: true } });
                if (project && !existingTeams.includes(project.teamId)) {
                    parentMembershipsToCreate.push({ userId: user.id, role: 'READER', teamId: project.teamId });
                }
                currentItem = { type: 'team', id: project?.teamId };
            }

            if (currentItem.type === 'team') {
                const team = await prisma.team.findUnique({ where: { id: currentItem.id }, select: { companyId: true } });
                if (team && !existingComps.includes(team.companyId)) {
                     parentMembershipsToCreate.push({ userId: user.id, role: 'READER', companyId: team.companyId });
                }
                currentItem = { type: 'company', id: team?.companyId };
            }

            if (currentItem.type === 'company') {
                const company = await prisma.company.findUnique({ where: { id: currentItem.id }, select: { organizationId: true } });
                if (company && !existingOrgs.includes(company.organizationId)) {
                    parentMembershipsToCreate.push({ userId: user.id, role: 'READER', organizationId: company.organizationId });
                }
            }
        } catch (e) {
            console.error("Error fetching parent hierarchy:", e);
            // Decide if we should fail the whole request or just log and continue
            return res.status(500).json({ error: 'Failed to resolve item hierarchy for permissions.' });
        }


        const mainMembershipToCreate = {
            data: {
                userId: user.id,
                role: role,
                [`${resourceType}Id`]: resourceId,
            },
            include: {
                user: {
                    select: { id: true, email: true, password: true }
                }
            }
        };

        // Use a transaction to create all memberships at once
        const transactionOps = [
            prisma.membership.create(mainMembershipToCreate)
        ];

        if (parentMembershipsToCreate.length > 0) {
            transactionOps.push(prisma.membership.createMany({
                data: parentMembershipsToCreate,
                skipDuplicates: true, // This is a safeguard
            }));
        }
        
        const result = await prisma.$transaction(transactionOps);
        const membership = result[0];

        if (invitationLink) {
            res.status(201).json({ 
                message: 'User does not exist. An invitation has been created.',
                invitationLink,
                membership,
             });
        } else {
             // Create a virtual 'status' field for the single user being added
            const membershipWithStatus = {
                ...membership,
                user: {
                    ...membership.user,
                    status: membership.user.password ? 'ACTIVE' : 'PENDING',
                }
            };
            delete membershipWithStatus.user.password; // Don't send password hash to client
            res.status(201).json(membershipWithStatus);
        }
    } catch (error) {
        console.error('Error adding member:', error);
        res.status(500).json({ error: 'An error occurred while adding the member.' });
    }
});


// Remove a member from a resource
router.delete('/:membershipId', async (req, res) => {
    const { membershipId } = req.params;

    try {
        const membership = await prisma.membership.findUnique({
            where: { id: membershipId },
        });

        if (!membership) {
            return res.status(404).json({ error: 'Membership not found.' });
        }

        const { organizationId, companyId, teamId, projectId } = membership;
        const resourceType = organizationId ? 'organization' : companyId ? 'company' : teamId ? 'team' : 'project';
        const resourceId = organizationId || companyId || teamId || projectId;
        
        const canManage = await hasPermission(req.user, 'ADMIN', resourceType, resourceId);
        if (!canManage) {
            return res.status(403).json({ error: 'You are not authorized to remove members from this resource.' });
        }
        
        await prisma.membership.delete({
            where: { id: membershipId },
        });

        res.status(204).send();
    } catch (error) {
        console.error('Error removing member:', error);
        res.status(500).json({ error: 'An error occurred while removing the member.' });
    }
});

// Update a member's role
router.put('/:membershipId', async (req, res) => {
    const { membershipId } = req.params;
    const { role } = req.body;

    if (!role) {
        return res.status(400).json({ error: 'Role is required.' });
    }

    try {
        const membership = await prisma.membership.findUnique({
            where: { id: membershipId },
        });

        if (!membership) {
            return res.status(404).json({ error: 'Membership not found.' });
        }
        
        const { organizationId, companyId, teamId, projectId } = membership;
        const resourceType = organizationId ? 'organization' : companyId ? 'company' : teamId ? 'team' : 'project';
        const resourceId = organizationId || companyId || teamId || projectId;

        const canManage = await hasPermission(req.user, 'ADMIN', resourceType, resourceId);
        if (!canManage) {
            return res.status(403).json({ error: 'You are not authorized to update members in this resource.' });
        }

        const updatedMembership = await prisma.membership.update({
            where: { id: membershipId },
            data: { role },
            include: {
                user: {
                    select: { id: true, email: true }
                }
            }
        });

        res.json(updatedMembership);
    } catch (error) {
        console.error('Error updating member role:', error);
        res.status(500).json({ error: 'An error occurred while updating the member role.' });
    }
});

export default router;