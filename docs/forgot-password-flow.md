# Forgot Password Implementation Plan

This document outlines the plan for adding a secure forgot password flow to the application.

## 1. Overview

The flow is designed to be secure and integrate with the existing authentication system, specifically for users with password-based accounts. Users who sign in via OIDC SSO are not eligible for password resets.

1.  **Initiation**: A user clicks a "Forgot Password?" link on the login page. The UI will toggle into a "reset mode".
2.  **Email Submission**: The user enters their email address and submits the form.
3.  **Token Generation**: The backend validates the user exists and has a password. It then generates a secure, single-use, time-limited token, stores a hashed version in the database, and logs the reset link to the server console for testing.
4.  **Password Reset Page**: A new page, `/reset-password`, will accept the token from the URL. The user can enter and confirm their new password here.
5.  **Finalization**: The API validates the token and the new password, updates the user's password hash in the database, and invalidates the reset token.

## 2. Backend Implementation

### Database Schema (`packages/api/prisma/schema.prisma`)

A new `PasswordResetToken` model will be added to manage reset tokens securely and separately from the `User` model.

```prisma
model PasswordResetToken {
  id        String   @id @default(cuid())
  token     String   @unique // Stores the HASHED token
  userId    String   @unique // Foreign key to the User
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  expiresAt DateTime
  createdAt DateTime @default(now())
}
```

The `User` model will be updated with the corresponding relation:

```prisma
model User {
  // ... existing fields
  passwordResetToken PasswordResetToken?
}
```

### API Endpoints (`packages/api/src/routes/auth.js`)

Two new endpoints will be added:

1.  **`POST /api/v1/auth/forgot-password`**:
    *   Takes an `email`.
    *   Verifies the user exists and has a password (i.e., not an SSO-only user).
    *   Generates and hashes a reset token, storing it in the `PasswordResetToken` table.
    *   Logs the un-hashed token in a reset link to the server console.

2.  **`POST /api/v1/auth/reset-password`**:
    *   Takes a `token` and a new `password`.
    *   Validates the token's existence and expiration.
    *   Hashes the new password and updates the `User` record.
    *   Deletes the used `PasswordResetToken` to prevent reuse.

## 3. Frontend Implementation

### Login Page (`packages/web/src/pages/LoginPage.jsx`)

*   A "Forgot Password?" link will be added.
*   Clicking the link will toggle a "reset mode" within the component, hiding the password field and changing the primary action button to "Send Reset Link," which will call the `forgot-password` endpoint.

### New Reset Password Page (`packages/web/src/pages/ResetPasswordPage.jsx`)

*   A new page will be created at the route `/reset-password`.
*   It will contain a form for a new password and password confirmation.
*   It will read the reset `token` from the URL query parameters and submit it along with the new password to the `reset-password` endpoint. 