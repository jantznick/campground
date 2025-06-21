# OIDC Single Sign-On (SSO) Integration Plan

This document outlines the technical plan and implementation steps for integrating OIDC-based Single Sign-On (SSO) into the application, allowing organization admins to connect their own identity providers.

## 1. Overview

The core goal is to enable per-organization SSO. Administrators will configure their OIDC provider details, and their users will be able to log in using their company credentials. The implementation will follow an "Identifier-First" login flow, where the application detects if a user's email domain is linked to an SSO configuration and prompts them to use it.

## 2. Implementation Phases

The work is broken down into three phases: Backend, Frontend, and Finalization.

### Phase 1: Backend (API & Database)

1.  **Database Schema (`schema.prisma`):**
    *   Create a new `OIDCConfiguration` model.
    *   Establish a one-to-one relationship with the `Organization` model.
    *   Fields: `issuerURL`, `clientID`, `clientSecret` (encrypted), `buttonText`, `isEnabled`.

2.  **API Endpoints (`packages/api/src/routes/oidc.js`):**
    *   Create RESTful endpoints (`GET`, `POST`, `DELETE`) under `/api/organizations/:orgId/oidc` for managing OIDC settings.
    *   Protect these endpoints with middleware to ensure only organization admins can access them.

3.  **Authentication Core (`passport.js`):**
    *   Add `passport` and `passport-openidconnect` dependencies.
    *   **Login Initiation (`/api/auth/oidc/initiate`):** A public endpoint that takes an organization identifier, looks up its OIDC configuration, dynamically initializes the `passport-openidconnect` strategy, and redirects the user to the provider.
    *   **Callback Handling (`/api/auth/oidc/callback`):** Handles the return from the provider. It will validate the token, perform Just-in-Time (JIT) user provisioning if the user is new, create a session, and redirect to the application's dashboard.

### Phase 2: Frontend (React UI)

1.  **OIDC Settings Component (`packages/web/src/components/settings/OIDCSettings.jsx`):**
    *   A new form component for organization admins to configure and manage their OIDC settings.
    *   This component will be integrated into the existing `SettingsPage`.

2.  **Login Page (`packages/web/src/pages/LoginPage.jsx`):**
    *   Enhance the login form to check for an OIDC configuration based on the user's email domain after they type it.
    *   If a configuration exists, hide the password field and show a "Login with SSO" button that directs the user to the initiation endpoint.

3.  **State Management (`packages/web/src/stores/useOIDCStore.js`):**
    *   A new Zustand store to manage the state for the OIDC configuration form.

### Phase 3: Finalization

1.  **Security Hardening:**
    *   Implement encryption-at-rest for the `clientSecret` in the database.
    *   Ensure the OIDC `state` parameter is used correctly to prevent CSRF attacks.
    *   Implement an OIDC-compliant logout flow.

2.  **Documentation & Testing:**
    *   Update `docs/testing.md` with instructions for testing the OIDC flow.
    *   Update `readme.md` to list OIDC/SSO as a feature. 