import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { protect } from '../middleware/authMiddleware.js';
import { hasPermission } from '../utils/permissions.js';
import crypto from 'crypto';
import { sendEmail } from '../utils/email.js';
import React from 'react';
import { UserInvitation } from '../../../emails/emails/UserInvitation.jsx';

const prisma = new PrismaClient();
const router = Router();

router.use(protect);

// POST /api/v1/invitations/resend - Resend an invitation to a pending user
router.post('/resend', async (req, res) => {
    const { userId } = req.body;

    if (!userId) {
        return res.status(400).json({ error: 'User ID is required.' });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { invitation: true }
        });

        // Ensure the user exists and is actually pending by checking for a null password
        console.log(user);
		if (!user) {
            return res.status(404).json({ error: 'A pending invitation for this user was not found.' });
        }

		if (user && user.emailVerified) {
			return res.status(400).json({ error: 'This user has already been registered.' });
		}
        
        // The user must have permission to manage the resource the user was invited to.
        // This requires finding the user's membership.
        const membership = await prisma.membership.findFirst({
            where: { userId: user.id }
        });

        if (!membership) {
            return res.status(404).json({ error: 'Could not find the membership associated with this invitation.' });
        }

        const { organizationId, companyId, teamId, projectId } = membership;
        const resourceType = organizationId ? 'organization' : companyId ? 'company' : teamId ? 'team' : 'project';
        const resourceId = organizationId || companyId || teamId || projectId;

        const canManage = await hasPermission(req.user, ['ADMIN', 'EDITOR', 'READER'], resourceType, resourceId);
        if (!canManage) {
            return res.status(403).json({ error: 'You are not authorized to manage members for this resource.' });
        }

        // Generate a new token and expiry
        const newInvitationToken = crypto.randomBytes(32).toString('hex');
        const newExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

		await prisma.invitation.deleteMany({ where: { userId: user.id } });
		const invitation = await prisma.invitation.create({
			data: {
				userId: user.id,
				email: user.email,
				token: newInvitationToken,
				expires: newExpires,
			},
		})
        
        const invitationLink = `${process.env.WEB_URL}/register?invite_token=${invitation.token}`;
		console.log(invitationLink);

        await sendEmail({
          to: user.email,
          subject: `You've been invited to Campground`,
          react: React.createElement(UserInvitation, {
            inviterName: req.user.name || req.user.email,
            organizationName: 'Campground', // This could be made more specific
            inviteLink: invitationLink,
          }),
        });

        res.status(200).json({ 
          message: "Invitation sent successfully",
          invitationLink: invitationLink 
        });

    } catch (error) {
        console.error('Resend invitation error:', error);
        res.status(500).json({ error: 'Failed to resend invitation.' });
    }
});

export default router; 