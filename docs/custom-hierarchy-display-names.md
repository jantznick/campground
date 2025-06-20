# Feature: Custom Hierarchy Display Names

## Overview

This feature allows Organization Administrators to customize the display names for the hierarchical levels within the application (Organization, Company, Team, Project). This provides a more tailored experience for each organization, allowing them to use their own internal terminology.

For example, an organization might prefer to call "Teams" -> "Squads" and "Projects" -> "Initiatives".

## Implementation Plan

The implementation is broken down into two main parts: the backend API and the frontend UI.

### Part 1: Backend (API & Database)

1.  **Database Schema Update:**
    *   A new `Json?` field named `hierarchyDisplayNames` will be added to the `Organization` model in `packages/api/prisma/schema.prisma`.
    *   This field will store an object with singular and plural forms for each hierarchy level, e.g., `{ "project": { "singular": "Initiative", "plural": "Initiatives" } }`.
    *   A database migration will be generated and applied to reflect this change.

2.  **API Endpoint Update:**
    *   The existing `PUT /api/organizations/:organizationId` endpoint will be updated to handle the modification of the `hierarchyDisplayNames` field.
    *   The endpoint's authorization will ensure only Organization Admins can make this change.

3.  **Data Hydration:**
    *   The `hierarchyDisplayNames` object will be included in key API responses (e.g., `/api/hierarchy`, login/auth) to ensure the frontend has access to the custom names upon loading.

### Part 2: Frontend (UI & State Management)

1.  **State Management (Zustand):**
    *   The `useOrganizationStore` will be updated to store and manage the `hierarchyDisplayNames` for the current organization.
    *   A centralized selector function, `getDisplayName(level, form)`, will be created to retrieve the appropriate name, falling back to default values if no custom name is set.

2.  **Settings UI (`HierarchySettings.jsx`):**
    *   A new settings component will be created.
    *   This component will be visible to all members of an organization.
    *   **Admins** will see an editable form to set the custom names.
    *   **Non-Admins** will see a read-only display of the current names.

3.  **Dynamic UI Text:**
    *   The entire web application will be systematically updated to use the `getDisplayName()` function from the store instead of hardcoded terms like "Project", "Company", etc. This will ensure all labels, titles, and buttons across the UI reflect the organization's custom settings. 