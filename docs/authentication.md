# Authentication Architecture

This document provides a comprehensive overview of the different methods for user authentication and provisioning within the Campground application.

## 1. Core Concepts

Our authentication system is built on a foundation of `passport.js` and `express-session`, using a Prisma-backed session store. This means that once a user is authenticated, their session is stored securely in the database, and a cookie is used to identify them on subsequent requests.

There are three primary ways a user can be authenticated and provisioned into the system:
1.  **Standard Password Authentication** (Registration & Login)
2.  **Auto-Join via Email Domain** (A provisioning feature on top of password registration)
3.  **OIDC Single Sign-On (SSO)** (Both for login and Just-in-Time provisioning)

---

## 2. Authentication & Provisioning Methods

### 2.1. Standard Password Authentication

This is the traditional email and password flow.

*   **Registration (`POST /api/v1/register`):**
    1.  A user provides an email and a password.
    2.  The system first checks if a user with that email **already exists**. If so, it returns a `409 Conflict` error to prevent account hijacking. This is a critical security check.
    3.  If the user is new, the password is securely hashed using `bcrypt`.
    4.  A new `User` record is created in the database.
    5.  By default, a new user gets their own `Organization` created, and they are assigned the `ADMIN` role for it.
    6.  The user is then automatically logged in, and a session is created.

*   **Login (`POST /api/v1/login`):**
    1.  A user provides their email and password.
    2.  The system finds the user by email.
    3.  It securely compares the provided password with the hashed password in the database using `bcrypt.compare`.
    4.  If the credentials are valid, a session is established using `passport.login()`.

### 2.2. Auto-Join via Email Domain

This is not an authentication method itself, but rather a **provisioning rule** that enhances the standard registration flow.

*   **How it works:**
    *   During the standard registration process, after hashing the password but before creating the user, the system extracts the domain from the user's email address (e.g., `acme.com`).
    *   It checks the `AutoJoinDomain` table for a verified rule matching that domain.
    *   If a rule is found, instead of creating a new organization for the user, it adds them as a member to the `Organization` or `Company` specified in the rule, with the role defined in that rule.
    *   This allows organizations to automatically onboard employees who sign up with a company email address.

### 2.3. OIDC Single Sign-On (SSO)

This method allows users to authenticate via an external Identity Provider (IdP) like Okta or Auth0. It supports two distinct login flows.

*   **Service Provider (SP)-Initiated Login:**
    1.  The user navigates to our login page and enters their email address.
    2.  The frontend performs a "check" against the API. The API looks up the OIDC configuration based on the user's email domain.
    3.  If an OIDC configuration is found, the UI changes, hiding the password field and showing a "Login with SSO" button.
    4.  Clicking the button redirects the user to their IdP to authenticate.
    5.  Upon success, the IdP redirects the user back to our callback URL (`/api/v1/auth/oidc/callback`).

*   **Identity Provider (IdP)-Initiated Login:**
    1.  The user starts their login from their IdP's application dashboard.
    2.  The IdP makes a `POST` request directly to our callback URL, sending a signed `id_token`.
    3.  Our server decodes the token (without verifying it) to read the `issuer` claim.
    4.  The `issuer` is used to look up the correct `OIDCConfiguration` from the database.
    5.  With the correct configuration loaded, Passport.js can then securely verify the token's signature and log the user in.

*   **Just-in-Time (JIT) Provisioning:**
    *   If a user authenticates via SSO but does not have an account in our system, an account is created for them automatically.
    *   They are added as a member to the `Organization` linked to the OIDC configuration.
    *   The role they are assigned is the **`defaultRole`** set by the administrator in the OIDC settings.

---

## 3. How the Methods Interact

Understanding the interplay between these systems is critical.

*   **OIDC vs. Auto-Join:** The OIDC flow is completely independent of the Auto-Join rules. If a user logs in via SSO, their provisioning is determined **only** by the `OIDCConfiguration`'s `defaultRole`. The `AutoJoinDomain` table is not consulted. Auto-Join rules only apply during the standard password registration flow.

*   **SSO and Existing Accounts:** If a user with a password-based account (e.g., `user@acme.com`) later authenticates via an OIDC provider linked to the same email, the system will find their existing account and simply log them in. It will **not** alter their existing permissions or memberships. This allows users to link their SSO identity to their pre-existing account seamlessly.

*   **SSO-Provisioned Users and Passwords:** A user who is created via the JIT provisioning flow will have a `User` record but their `password` field will be `null`. If this user attempts to sign up via the standard registration form, the system will correctly identify that the email is already in use and block the registration with a `409 Conflict` error. **Currently, there is no flow for an SSO-provisioned user to subsequently add a password to their account.**

---

## 4. For Administrators: How to Set Up OIDC SSO

This guide provides generic steps for setting up OIDC with a provider like Okta, Auth0, or Azure AD. The specific names of fields may vary slightly between providers.

**Step 1: Create an Application in Your Identity Provider**

1.  Log in to your organization's Identity Provider (e.g., Okta).
2.  Find the section to create a new application integration.
3.  Choose **OIDC - OpenID Connect** as the sign-in method.
4.  Select **Web Application** as the application type.

**Step 2: Configure the Application**

1.  **Application Name**: Give the application a name, like "Campground".
2.  **Sign-in redirect URI / Callback URL**: This is the most important step.
    *   In Campground, go to your Organization's settings page, find the "Single Sign-On (OIDC)" section.
    *   You will see a read-only field labeled **"Callback / Redirect URL"**.
    *   Copy this URL.
    *   Paste it into the "Sign-in redirect URI" (or similarly named) field in your IdP's application settings.
3.  **Assignments**: Assign the users or groups from your organization who should be allowed to log in to Campground.
4.  Save the application.

**Step 3: Transfer Credentials to Campground**

1.  After saving, your IdP will provide you with the credentials Campground needs. These are typically found on the application's main page.
    *   **Client ID**: Copy this value.
    *   **Client Secret**: Copy this value.
    *   **Issuer URL**: This is often just your main Okta or Auth0 domain (e.g., `https://your-org.okta.com`).
2.  In Campground's OIDC settings, paste these values into the corresponding fields: `Client ID`, `Client Secret`, and `Issuer URL`.
3.  Most providers will also give you specific endpoint URLs. Fill these in as well: `Authorization URL`, `Token URL`, and `User Info URL`. Often these can be found in your provider's "Well-Known Configuration" endpoint.
4.  **Default Role**: Choose the role (e.g., Reader, Editor) that new users provisioned via SSO should receive.
5.  Save the configuration in Campground.

Your OIDC connection is now active. Assigned users can now log in to Campground from your IdP's dashboard or by entering their email on the Campground login page.

---

## 5. For Developers: Extending the Authentication System

The current authentication system is designed to be extensible. Here are some common ways it could be enhanced.

### 5.1. Implementing "Set/Reset Password" for SSO Users

As noted, SSO-provisioned users cannot currently set a password. To implement this:

1.  **Create a "Forgot Password" flow**:
    *   Build a new API endpoint (e.g., `POST /api/v1/auth/forgot-password`). It takes an email, finds the user, and emails them a secure, single-use, time-limited token (e.g., using a new `PasswordResetToken` model in Prisma).
    *   Build a new page (e.g., `/reset-password?token=...`) that accepts this token.
    *   The page submits the token and a new password to an endpoint like `POST /api/v1/auth/reset-password`.
    *   The endpoint validates the token, hashes the new password, and updates the `password` field on the `User` model.
2.  **Update the Login UI**: On the login page, add a "Forgot Password?" link that directs users to this new flow.

### 5.2. Adding Support for SAML

While OIDC is modern and preferred, some enterprises still require SAML.

*   **Strategy**: Use a library like `passport-saml`.
*   **Implementation**:
    1.  Add a `SAMLConfiguration` model to `prisma.schema`, similar to `OIDCConfiguration`.
    2.  The `dynamicOidcStrategy` in `passport.js` provides a perfect template for a `dynamicSamlStrategy`. This middleware would look up the SAML configuration based on an `entityID` or other identifier and dynamically configure the `passport-saml` strategy for each request.
    3.  Add new API routes and frontend components for SAML configuration.

### 5.3. Advanced Profile Syncing

Currently, we only provision a user with their email. We could sync more data from the IdP profile.

*   **Implementation**:
    1.  Add new fields to the `User` model in `prisma.schema` (e.g., `firstName`, `lastName`, `avatarUrl`).
    2.  In the OIDC verify callback within `dynamicOidcStrategy` (`packages/api/src/utils/passport.js`), expand the user creation and update logic.
    3.  Map fields from the `profile` object provided by Passport (e.g., `profile.name.givenName`, `profile.name.familyName`) to the new fields on your `User` model.
    4.  This would allow Campground to have richer user profiles populated automatically from the IdP. 