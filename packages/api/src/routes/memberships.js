import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { protect } from '../middleware/authMiddleware.js';
import { hasPermission } from '../utils/permissions.js';
import crypto from 'crypto';
import { getAncestors, getDescendants } from '../utils/hierarchy.js';

const prisma = new PrismaClient();
const router = Router();

async function getEffectiveMembersForUsers(resourceType, resourceId, userIds = null) {
    // 1. Get the full resource tree (ancestors and descendants)
    const ancestors = await getAncestors(resourceType, resourceId);
    const descendants = await getDescendants(resourceType, resourceId);

    const resourceTreeIds = {
        organizationIds: [ancestors.organizationId, resourceType === 'organization' ? resourceId : null, ...(descendants.organizationIds || [])].filter(Boolean),
        companyIds: [ancestors.companyId, resourceType === 'company' ? resourceId : null, ...(descendants.companyIds || [])].filter(Boolean),
        teamIds: [ancestors.teamId, resourceType === 'team' ? resourceId : null, ...(descendants.teamIds || [])].filter(Boolean),
        projectIds: [resourceType === 'project' ? resourceId : null, ...(descendants.projectIds || [])].filter(Boolean),
    };

    // 2. Gather all memberships related to the tree for the specified users (or all users if null)
    const whereClause = {
        OR: [
            { organizationId: { in: resourceTreeIds.organizationIds } },
            { companyId: { in: resourceTreeIds.companyIds } },
            { teamId: { in: resourceTreeIds.teamIds } },
            { projectId: { in: resourceTreeIds.projectIds } },
        ],
    };

    if (userIds) {
        whereClause.userId = { in: userIds };
    }
    
    const allMemberships = await prisma.membership.findMany({
        where: whereClause,
        include: {
            user: {
                select: { id: true, email: true, emailVerified: true },
            },
            organization: { select: { name: true } },
            company: { select: { name: true } },
            team: { select: { name: true } },
            project: { select: { name: true } },
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
                id: null, // Placeholder, will be set by a direct membership
                user: {
                    id: m.user.id,
                    email: m.user.email,
                    status: m.user.emailVerified ? 'ACTIVE' : 'PENDING',
                },
                effectiveRole: 'VIEWER', // Default to viewer
                roleSource: 'viewer',
                roleSourceId: null,
            });
            currentUserData = effectiveMembers.get(userId);
        }

        let role, source, sourceId, sourceName;

        if (m.organizationId) { role = m.role; source = 'organization'; sourceId = m.organizationId; sourceName = m.organization.name; }
        else if (m.companyId) { role = m.role; source = 'company'; sourceId = m.companyId; sourceName = m.company.name; }
        else if (m.teamId) { role = m.role; source = 'team'; sourceId = m.teamId; sourceName = m.team.name; }
        else if (m.projectId) { role = m.role; source = 'project'; sourceId = m.projectId; sourceName = m.project.name; }

        const isDirect = sourceId === resourceId;
        const isAncestor = ancestors[`${source}Id`] === sourceId;

        let newEffectiveRole = 'VIEWER';
        let newRoleSource = `Viewer from ${source} "${sourceName}"`;
        
        if (isDirect) {
            newEffectiveRole = role;
            newRoleSource = `Direct member`;
        } else if (isAncestor && role === 'ADMIN') {
            newEffectiveRole = 'ADMIN';
            newRoleSource = `Admin of parent ${source} "${sourceName}"`;
        }

        const rolePrecedence = { 'VIEWER': 1, 'READER': 2, 'EDITOR': 3, 'ADMIN': 4 };

        if (rolePrecedence[newEffectiveRole] > rolePrecedence[currentUserData.effectiveRole]) {
            currentUserData.effectiveRole = newEffectiveRole;
            currentUserData.roleSource = newRoleSource;
            currentUserData.roleSourceId = sourceId;
        }

        if (isDirect) {
             currentUserData.id = m.id; // Set the actual membership ID for direct members
        }
    }

    return Array.from(effectiveMembers.values());
}

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

        const effectiveMembers = await getEffectiveMembersForUsers(resourceType, resourceId);

        // Authorization Check: Ensure the requesting user is part of the hierarchy.
        const isAuthorized = effectiveMembers.some(m => m.user.id === req.user.id);
        if (!isAuthorized) {
            return res.status(403).json({ error: 'You are not authorized to view members of this resource.' });
        }
        
        res.json(effectiveMembers);

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
			// TODO: Send email to new user with invitation link
			const inviter = await prisma.user.findUnique({ where: { id: req.user.id } });
			const { organization, company } = await getMembershipDetails(resourceId);
			const itemName = company?.name || organization?.name;
	
			// Send invitation email
			await sendEmail({
			  to: user.email,
			  subject: `You've been invited to join ${itemName}`,
			  templateName: 'userInvitation',
			  templateProps: {
				inviterName: inviter.name || inviter.email,
				organizationName: itemName,
				inviteLink: invitationLink,
			  },
			});
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

        await prisma.membership.createMany({
            data: parentMembershipsToCreate,
            skipDuplicates: true,
        });

        await prisma.membership.create({
            data: {
                userId: user.id,
                role: role,
                [`${resourceType}Id`]: resourceId,
            },
        });

        // After creating the membership, return the full "effective member" object
        const [ member ] = await getEffectiveMembersForUsers(resourceType, resourceId, [user.id]);

        res.status(201).json({ ...member, invitationLink });

    } catch (error) {
        if (error.code === 'P2002') {
            console.error('Duplicate entry error:', error);
            res.status(409).json({ error: 'User already exists or duplicate entry error.' });
        } else {
            console.error('Error adding member:', error);
            res.status(500).json({ error: 'An error occurred while adding the member.' });
        }
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
router.put('/:id', async (req, res) => {
    const { id: membershipId } = req.params;
    const { role, resourceId, resourceType } = req.body;

    if (!role || !resourceId || !resourceType) {
        return res.status(400).json({ error: 'Role, resourceId, and resourceType are required.' });
    }

    try {
        const canManage = await hasPermission(req.user, 'ADMIN', resourceType, resourceId);
        if (!canManage) {
            return res.status(403).json({ error: 'You are not authorized to change roles for this resource.' });
        }

        const updatedMembership = await prisma.membership.update({
            where: { id: membershipId },
            data: { role },
        });

        // After updating, return the full "effective member" object
        const [ member ] = await getEffectiveMembersForUsers(resourceType, resourceId, [updatedMembership.userId]);

        res.json(member);

    } catch (error) {
        console.error('Error updating member role:', error);
        res.status(500).json({ error: 'An error occurred while updating the member role.' });
    }
});

export default router;