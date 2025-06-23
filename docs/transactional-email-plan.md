# Transactional Email Implementation Plan

This document outlines the step-by-step plan for integrating transactional emails into the application.

### Phase 1: Project Setup & Dependencies

1.  **Install Dependencies:** Add `resend` and `react-email` as dependencies to the `packages/api` workspace.
2.  **Create `emails` Package:** Create a new workspace, `packages/emails`, to house the React Email templates.
3.  **Initialize React Email:** Set up the necessary configuration for React Email within the new `packages/emails` directory.
4.  **Configure Environment:** Add the `RESEND_API_KEY` to the `.env` configuration for the `api` service.

### Phase 2: Centralized Email Utility

1.  **Create Utility Module:** Create a new file at `packages/api/src/utils/email.js`.
2.  **Implement `sendEmail` Function:** This module will initialize the Resend client and contain a core `sendEmail` function responsible for rendering React Email templates and dispatching emails via the Resend API.

### Phase 3: Email Template Creation

Inside the `packages/emails/` directory, create four React components for the email templates:

1.  **`NewUserWelcome.jsx`:** For users who sign up with an email and password.
2.  **`ForgotPassword.jsx`:** For sending a secure password reset link.
3.  **`UserInvitation.jsx`:** For inviting a new user to join an organization or company.
4.  **`AdminAutoJoinNotification.jsx`:** To notify administrators when a new user joins via a verified domain.

### Phase 4: API Integration

Integrate calls to the email utility at the correct locations within the existing business logic:

1.  **Forgotten Password Email:** In `packages/api/src/routes/auth.js`, replace the `console.log` in the `forgot-password` route with a call to send the `ForgotPassword.jsx` email.
2.  **New User Welcome Email:** In `packages/api/src/routes/auth.js` (`/register` route), send the `NewUserWelcome.jsx` email when a user creates a new account and organization (not an auto-join or SSO-provisioned user).
3.  **User Invitation Email:** In `packages/api/src/routes/invitations.js`, send the `UserInvitation.jsx` email after an invitation is created.
4.  **Auto-Join Admin Notification Email:** In `packages/api/src/routes/auth.js` (`/register` route), within the auto-join logic, query for admins and send them the `AdminAutoJoinNotification.jsx` email after a new user joins. 