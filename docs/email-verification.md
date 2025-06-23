# Email Verification Flow

This document outlines the implementation of the email verification process for new users signing up via username and password.

## Objective

To enhance security by ensuring that a user has control over the email address they use to sign up, which is critical for features like domain-based auto-joining for an organization. This flow prevents users from gaining access to an organization based on an email domain they haven't verified.

## High-Level Flow

1.  **User Registration (Username/Password):**
    *   A new `User` record is created in the database.
    *   The user's `emailVerified` status is set to `false`.
    *   A 6-digit `verificationToken` and an expiration timestamp are generated and stored for the user.
    *   The user receives the standard "Welcome" email, now including the 6-digit verification code.

2.  **User Registration (OIDC/SSO):**
    *   SSO providers are considered trusted sources for email verification.
    *   When a user is created via SSO, their `emailVerified` status is immediately set to `true`. No verification code is needed.

3.  **Login Flow (Unverified User):**
    *   If a user with `emailVerified: false` logs in, they are redirected to a dedicated `/verify` page.
    *   A new verification token is automatically generated and sent to them upon login, ensuring they always have a fresh code to use.
    *   Access to all other application pages and API endpoints is blocked until their email is verified.

4.  **Verification Page:**
    *   The user enters the 6-digit code from their email.
    *   The frontend sends the code to the backend for validation.
    *   Upon successful validation, `emailVerified` is set to `true`, and the user is redirected to the main application dashboard.

## Technical Implementation Details

### Backend

*   **Database:** The `User` model in `prisma/schema.prisma` is extended with:
    *   `emailVerified` (Boolean, default: `false`)
    *   `verificationToken` (String, nullable)
    *   `verificationTokenExpiresAt` (DateTime, nullable)
*   **API Endpoints:**
    *   `POST /api/auth/verify-email`: Authenticated endpoint to submit the verification code.
    *   `POST /api/auth/resend-verification`: Authenticated endpoint to request a new code manually.
*   **Middleware:**
    *   A middleware check is added to protect all sensitive API routes, returning a `403 Forbidden` error if the authenticated user has not verified their email.

### Frontend

*   **State Management:** The `useAuthStore` is updated to include the `emailVerified` status in the user object.
*   **Routing:** A routing guard in `App.jsx` redirects unverified users to the `/verify` page, blocking access to the rest of the application.
*   **New Page:** A new page at `/verify` is created for users to enter their verification code.

### Email

*   **Template Modification:** The existing `NewUserWelcome.jsx` email template is modified to conditionally include the verification code if one is passed to it. 