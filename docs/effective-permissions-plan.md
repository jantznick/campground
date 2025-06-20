# Plan: Comprehensive User Access Visibility

This document outlines the plan to refactor the membership system to provide administrators with a complete and intuitive view of user access for any given resource.

## Core Objective

The goal is to change the "Members" view for any resource (Organization, Company, Team, or Project) from showing only *direct members* to showing **everyone who can view that resource in the UI**. This gives administrators a complete picture of access permissions, including inherited ones.

## Key Concepts

### 1. Effective Role

We will calculate an "Effective Role" for each user on a specific resource. This role represents their highest level of access, whether it's assigned directly or inherited from a parent/child resource.

### 2. The `VIEWER` Role

A new pseudo-role, `VIEWER`, will be introduced. A user is a `VIEWER` if they can see a resource in the sidebar but are not a direct member or an inherited admin. This typically occurs when a user has membership in a child resource (e.g., a project within a team) or non-admin access to a parent resource.

## Implementation Plan

### Phase 1: API Overhaul (`GET /api/v1/memberships`)

The primary logic will be implemented in the backend.

1.  **Full Resource Tree Discovery:** For a given resource, the API will find all its **ancestors** (parents up the hierarchy) and **descendants** (children down the hierarchy).
2.  **Gather All Memberships:** The API will fetch all `Membership` records associated with the target resource, its ancestors, and its descendants.
3.  **Calculate Effective Role:** The API will process these memberships to determine a single "Effective Role" for each user based on the following precedence:
    *   **Rule 1 (Direct Membership):** A direct role on the resource overrides any other.
    *   **Rule 2 (Inherited Admin):** An `ADMIN` role on a parent resource grants `ADMIN` on the child.
    *   **Rule 3 (Viewer):** All other cases where a user has visibility (e.g., membership on a child resource, or `READER`/`EDITOR` on a parent) result in a `VIEWER` role.
4.  **API Response:** The endpoint will return a list of members, each with their user details, status (`ACTIVE`/`PENDING`), their calculated `effectiveRole`, and a `roleSource` field to indicate where the permission originates (e.g., `"direct"`, `"inherited-from-company:MyCo"`, `"viewer-from-project:ProjX"`).

### Phase 2: Frontend Updates (`AccessManagement.jsx`)

The frontend will be updated to consume and display this richer data.

1.  **Display Effective Role:** The members table will show the `effectiveRole` for each user.
2.  **Read-Only Inherited Roles:** The role-selector dropdown will be **disabled** for users with inherited roles. Permission changes must be made on the resource where the membership is directly defined.
3.  **Informative Tooltips:** An info icon or similar UI element will be added next to inherited roles, with a tooltip explaining the source of the permission (using the `roleSource` data from the API).

## Workflow

1.  Create this planning document.
2.  Search the existing API codebase (`packages/api/src/`) for reusable helper functions for hierarchy traversal.
3.  Implement the API changes in `packages/api/src/routes/memberships.js`.
4.  Update the frontend store `useMembershipStore.js`.
5.  Update the frontend component `AccessManagement.jsx` to display the new data and implement the UI logic.
6.  Thoroughly test the new functionality using the seed data. 