# Feature: Auto-Join by Domain with DNS Verification

## Overview

This feature allows organizations and companies to specify email domains that will grant new users automatic membership upon registration. To prevent domain squatting and ensure security, an administrator must prove ownership of a domain by adding a DNS `TXT` record.

For example, an administrator for "Acme Corp" adds the domain `acme.com`. Our system provides a unique token. The admin adds this token as a `TXT` record to their domain's DNS settings. Once verified, any new user signing up with an `@acme.com` email will be automatically added to the Acme Corp organization.

## Implementation Plan

### Part 1: Backend (API & Database)

1.  **Database Schema:**
    *   The `AutoJoinDomain` model will be updated with two new fields:
        *   `status`: An enum (`PENDING` | `VERIFIED`), defaulting to `PENDING`.
        *   `verificationCode`: A unique string token generated upon creation.

2.  **Domain Management API:**
    *   `POST /api/.../domains`: This endpoint will now generate a `verificationCode` and save the new domain with a `PENDING` status.
    *   `POST /api/.../domains/:domainMappingId/verify`: A new endpoint will be created. It will use Node.js's built-in `dns` module to look up the `TXT` record for the domain. If the record contains the correct `verificationCode`, it will update the domain's `status` to `VERIFIED`.
    *   The existing management endpoints will be secured with `hasPermission`.

3.  **Public Domain Check API:**
    *   The `GET /api/auth/check-domain` endpoint will be updated to **only** return a match if the domain's `status` is `VERIFIED`.

4.  **Registration Logic:**
    *   The `POST /api/auth/register` logic will be updated to only create an automatic membership if the corresponding `AutoJoinDomain` record has a `status` of `VERIFIED`.

### Part 2: Frontend (UI & State Management)

1.  **Zustand Store (`useDomainStore.js`):**
    *   The store will be updated to handle the `status` and `verificationCode` fields.
    *   A new `verifyDomain(domainMappingId, ...)` action will be added to call the new verification endpoint.

2.  **Settings Component (`DomainManagement.jsx`):**
    *   The UI will be enhanced to show the `status` of each domain (`Pending` or `Verified`).
    *   For pending domains, it will display the required `verificationCode` and instructions for creating the DNS `TXT` record.
    *   A manual "Verify" button will be present for each pending domain.
    *   **Automatic Re-verification:** The component will also start a timer to automatically re-check the verification status of all pending domains periodically, providing a seamless UX for the user.

3.  **Updated Registration Page (`RegisterPage.jsx`):**
    *   No changes needed here. The existing logic will continue to work, but the API it calls is now more secure. 