import { Router } from 'express';
import { PrismaClient, Role } from '@prisma/client';
import { protect } from '../middleware/authMiddleware.js';
import { hasPermission } from '../utils/permissions.js';
import { encrypt, decrypt } from '../utils/crypto.js';

const prisma = new PrismaClient();
const router = Router();

// TODO: In a real app, clientSecret should be encrypted at rest.
// We'll add this later. For now, it's stored in plaintext.

// GET /api/v1/organizations/:orgId/oidc
// Gets the OIDC configuration for an organization.
router.get('/organizations/:orgId/oidc', protect, async (req, res) => {
  const { orgId } = req.params;
  const user = req.user;

  try {
    const hasAccess = await hasPermission(user, 'ADMIN', 'organization', orgId);
    if (!hasAccess) {
      return res.status(403).json({ error: 'You do not have permission to view this configuration.' });
    }

    const oidcConfig = await prisma.oIDCConfiguration.findUnique({
      where: { organizationId: orgId },
    });

    if (!oidcConfig) {
      return res.status(404).json({ message: 'OIDC configuration not found for this organization.' });
    }

    // Exclude clientSecret from the response for security.
    const { clientSecret, ...configToSend } = oidcConfig;
    // The client secret is encrypted in the DB, so we don't need to decrypt it for the GET request.
    res.status(200).json(configToSend);
  } catch (error) {
    console.error('Failed to get OIDC config:', error);
    res.status(500).json({ error: 'An error occurred while fetching OIDC configuration.' });
  }
});

// POST /api/v1/organizations/:orgId/oidc
// Creates the OIDC configuration for an organization.
router.post('/organizations/:orgId/oidc', protect, async (req, res) => {
  const { orgId } = req.params;
  const user = req.user;
  const { issuer, clientId, clientSecret, authorizationUrl, tokenUrl, userInfoUrl, defaultRole } = req.body;

  if (!issuer || !clientId || !clientSecret || !authorizationUrl || !tokenUrl || !userInfoUrl) {
    return res.status(400).json({ error: 'issuer, clientId, clientSecret, authorizationUrl, tokenUrl, and userInfoUrl are required.' });
  }

  if (defaultRole && !Object.values(Role).includes(defaultRole)) {
    return res.status(400).json({ error: 'Invalid defaultRole specified.' });
  }

  try {
    const hasAccess = await hasPermission(user, 'ADMIN', 'organization', orgId);
    if (!hasAccess) {
      return res.status(403).json({ error: 'You do not have permission to modify this configuration.' });
    }

    const existingConfig = await prisma.oIDCConfiguration.findUnique({
      where: { organizationId: orgId },
    });

    if (existingConfig) {
        return res.status(409).json({ error: 'OIDC configuration already exists for this organization. Use PUT to update.' });
    }

    const data = {
      organizationId: orgId,
      issuer,
      clientId,
      clientSecret: encrypt(clientSecret),
      authorizationUrl,
      tokenUrl,
      userInfoUrl,
      defaultRole, // If not provided, prisma schema default is used
    };

    const newConfig = await prisma.oIDCConfiguration.create({
        data,
    });

    const { clientSecret: _, ...configToSend } = newConfig;
    res.status(201).json(configToSend);
  } catch (error) {
    console.error('Failed to save OIDC config:', error);
    res.status(500).json({ error: 'An error occurred while saving OIDC configuration.' });
  }
});

// PUT /api/v1/organizations/:orgId/oidc
// Updates the OIDC configuration for an organization.
router.put('/organizations/:orgId/oidc', protect, async (req, res) => {
    const { orgId } = req.params;
    const user = req.user;
    const { issuer, clientId, clientSecret, authorizationUrl, tokenUrl, userInfoUrl, defaultRole } = req.body;

    if (defaultRole && !Object.values(Role).includes(defaultRole)) {
        return res.status(400).json({ error: 'Invalid defaultRole specified.' });
    }

    try {
        const hasAccess = await hasPermission(user, 'ADMIN', 'organization', orgId);
        if (!hasAccess) {
            return res.status(403).json({ error: 'You do not have permission to modify this configuration.' });
        }

        const data = {
            issuer,
            clientId,
            // Only update secret if a new one is provided
            ...(clientSecret && { clientSecret: encrypt(clientSecret) }),
            authorizationUrl,
            tokenUrl,
            userInfoUrl,
            defaultRole,
        };

        // Remove undefined fields so they don't overwrite existing values
        Object.keys(data).forEach(key => data[key] === undefined && delete data[key]);

        const updatedConfig = await prisma.oIDCConfiguration.update({
            where: { organizationId: orgId },
            data,
        });

        const { clientSecret: _, ...configToSend } = updatedConfig;
        res.status(200).json(configToSend);

    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ error: 'OIDC configuration not found for this organization. Use POST to create.' });
        }
        console.error('Failed to update OIDC config:', error);
        res.status(500).json({ error: 'An error occurred while updating OIDC configuration.' });
    }
});

// DELETE /api/v1/organizations/:orgId/oidc
// Deletes the OIDC configuration for an organization.
router.delete('/organizations/:orgId/oidc', protect, async (req, res) => {
  const { orgId } = req.params;
  const user = req.user;

  try {
    const hasAccess = await hasPermission(user, 'ADMIN', 'organization', orgId);
    if (!hasAccess) {
      return res.status(403).json({ error: 'You do not have permission to delete this configuration.' });
    }

    await prisma.oIDCConfiguration.delete({
      where: { organizationId: orgId },
    });

    res.status(204).send(); // No content
  } catch (error) {
    // Handle case where config doesn't exist gracefully
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'OIDC configuration not found for this organization.' });
    }
    console.error('Failed to delete OIDC config:', error);
    res.status(500).json({ error: 'An error occurred while deleting OIDC configuration.' });
  }
});

export default router; 