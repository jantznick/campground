# Feature: Auto-Join by Domain

## Overview

This feature allows organizations and companies to specify email domains that will grant new users automatic membership upon registration. This streamlines the onboarding process for users from a known entity, bypassing the need for manual invitations.

For example, an administrator for "Acme Corp" can add the domain `acme.com`. When a new user signs up with the email `employee@acme.com`, they will be automatically added to the Acme Corp organization with a pre-configured role.

## Implementation Plan

### Part 1: Backend (API & Database)

1.  **Database Schema:**
    *   A new model, `AutoJoinDomain`, will be created in `prisma/schema.prisma`.
    *   It will store the `domain`, the `role` to grant, and a link to either an `organizationId` or a `companyId`.
    *   Application logic will enforce that a domain is unique per entity and that only one of `organizationId` or `companyId` is set for a given record.

2.  **Domain Management API:**
    *   Endpoints will be added to the `organizations` and `companies` routers to manage these domains (GET, POST, DELETE).
    *   These endpoints will be protected by the `hasPermission` utility, ensuring only Admins of the corresponding resource can manage its domains.
    *   The backend will maintain a blocklist of common public domains (e.g., `gmail.com`, `outlook.com`) to prevent them from being added.

3.  **Public Domain Check API:**
    *   A new unauthenticated endpoint, `GET /api/auth/check-domain?domain=<domain>`, will be created.
    *   The registration page will use this to check if a domain is registered and inform the user which organization or company they will be joining.

4.  **Registration Logic:**
    *   The `POST /api/auth/register` endpoint will be updated.
    *   If a registering user has no invitation token, the system will check their email domain against the `AutoJoinDomain` table.
    *   The precedence rule is: a direct company match overrides an organization match.
    *   If a match is found, a `Membership` record is automatically created for the new user.

### Part 2: Frontend (UI & State Management)

1.  **New Settings Component (`DomainManagement.jsx`):**
    *   A new component will be created and added to the `SettingsPage` for organization and company-level settings.
    *   It will allow Admins to add domains and select a default role.
    *   It will display a prominent warning if the `ADMIN` or `EDITOR` role is selected, highlighting the security implications.
    *   It will list all configured domains with an option to delete them.

2.  **New Zustand Store (`useDomainStore.js`):**
    *   A new store will be created to handle the state and API calls for fetching, adding, and deleting auto-join domains.

3.  **Updated Registration Page (`RegisterPage.jsx`):**
    *   A front-end regex check will be implemented to validate the email format before making an API call.
    *   A debounced API call to `/api/auth/check-domain` will be triggered as the user types their email.
    *   If the domain is recognized, a message will be displayed below the email field informing the user they will be joining a specific organization or company. 