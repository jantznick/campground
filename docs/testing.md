# Permissions Testing Guide

This document outlines the test data created by the database seed script and provides a guide for manually testing user permissions and visibility within the application.

**Universal Password**: `password123`

---

## Test Scenarios & User Personas

### 1. TechCorp - Enterprise Account

#### Hierarchy:
- **Organization**: TechCorp
  - **Company**: Cloud Services (Company A)
    - **Team**: Compute (Team A1)
      - **Project**: Serverless V2
    - **Team**: Storage (Team A2)
      - **Project**: BlobStore
  - **Company**: Analytics Inc. (Company B)
    - **Team**: Data Platform (Team B1)
      - **Project**: Query Engine

#### Personas:

**a) Global Admin**
- **Email**: `globaladmin@test.com`
- **Role**: `ADMIN` of **TechCorp**
- **Expected Visibility & Permissions**:
  - Should see the entire TechCorp hierarchy (Company A, Company B, and all their children).
  - Can create new companies within TechCorp.
  - Can manage settings and users for TechCorp, Company A, Company B, and all child teams/projects.
  - **Should NOT** see the "SoloDev" organization.

**b) Company A Admin**
- **Email**: `companya_admin@test.com`
- **Role**: `ADMIN` of **Cloud Services (Company A)**
- **Expected Visibility & Permissions**:
  - Should see the TechCorp organization as a parent in the hierarchy.
  - Should see all teams and projects within Company A (Compute & Storage).
  - **Should NOT** see Company B ("Analytics Inc.") or its children in the sidebar.
  - Can manage settings and users for Company A and its child teams/projects.
  - Can view users and settings for the parent TechCorp organization.
  - **Should NOT** be able to edit TechCorp settings or manage its users (other than viewing).

**c) Team B1 Editor**
- **Email**: `teamb1_editor@test.com`
- **Role**: `EDITOR` of **Data Platform (Team B1)**
- **Expected Visibility & Permissions**:
  - Should see the hierarchy: `TechCorp` -> `Analytics Inc.` -> `Data Platform` -> `Query Engine`.
  - **Should NOT** see Company A or Team A1/A2 in the sidebar.
  - Can manage members of Team B1.
  - Can edit the "Query Engine" project.
  - **Should NOT** be able to edit the settings for Team B1 itself or its parent, Company B.
  - Can view users for Team B1, Company B, and TechCorp.

**d) Project A2-1 Reader**
- **Email**: `projecta21_reader@test.com`
- **Role**: `READER` of **BlobStore (Project in Team A2)**
- **Expected Visibility & Permissions**:
  - Should see the hierarchy: `TechCorp` -> `Cloud Services` -> `Storage` -> `BlobStore`.
  - **Should NOT** see the "Compute" team or its project in the sidebar.
  - Can view the "BlobStore" project details.
  - Can view the member lists for Project "BlobStore", Team "Storage", Company "Cloud Services", and "TechCorp".
  - **Should NOT** have any "Add Member" or "Edit" buttons visible anywhere.

---

### 2. SoloDev - Standard Account

#### Hierarchy:
- **Organization**: SoloDev
  - **Company**: Main App (Company C - *Default*)
    - **Team**: Mobile (Team C1)
      - **Project**: iOS App
    - **Team**: Web (Team C2)

#### Personas:

**a) SoloDev Admin**
- **Email**: `solodev_admin@test.com`
- **Role**: `ADMIN` of **SoloDev**
- **Expected Visibility & Permissions**:
  - As it's a `STANDARD` account, the Organization level should be abstracted away in the UI. They should only see their default company, "Main App".
  - Should see all teams and projects within "Main App".
  - Can manage all settings and users.
  - **Should NOT** see the "TechCorp" organization.

**b) Pending User**
- **Email**: `pending_user@test.com`
- **Role**: `READER` of **Web (Team C2)** (Invited, not accepted)
- **Expected Behavior**:
  - This user cannot log in with `password123`.
  - Log in as `solodev_admin@test.com` and navigate to the settings for the "Web" team. You should see `pending_user@test.com` with a "Pending" badge.
  - You should be able to resend/regenerate an invitation link for this user.
  - To test the invitation flow, use the generated link. The registration form should be pre-filled with the user's email. Use the invite token `test-token-12345` to test the registration flow directly: `http://localhost:3000/register?invite_token=test-token-12345`.
  - After setting a password, the user should be logged in and see the `SoloDev` -> `Main App` -> `Web` hierarchy.

---

### 3. Multi-Organization Access

#### Persona:

**a) The Consultant**
- **Email**: `consultant@test.com`
- **Role**: `READER` of **Analytics Inc. (Company B)** in TechCorp & `EDITOR` of **Mobile (Team C1)** in SoloDev.
- **Expected Visibility & Permissions**:
  - Should see both **TechCorp** and **SoloDev** organizations in the sidebar.
  - When viewing the TechCorp hierarchy, they should only see the path `TechCorp` -> `Analytics Inc.` and its children. They should not see "Cloud Services (Company A)".
  - When viewing the SoloDev hierarchy, they should only see the path `SoloDev` -> `Main App` -> `Mobile` and its children. They should not see the "Web" team.
  - As a `READER` in Company B, they should be able to view settings and users, but not edit them.
  - As an `EDITOR` in Team C1, they should be able to manage members of Team C1 and edit the "iOS App" project, but not edit the settings for Team C1 itself.

---

### 4. OIDC Single Sign-On (SSO)

This scenario requires a real external OIDC provider. A free Okta or Auth0 developer account is recommended.

#### 4.1. Configuration

1.  **Configure an OIDC Application** in your chosen provider (e.g., Okta).
    *   **Application Type**: Web Application.
    *   **Sign-in redirect URIs / Callback URL**: Copy the "Callback / Redirect URL" from the Stagehand settings page (e.g., `http://localhost:3001/api/v1/auth/oidc/callback`) and paste it here.
    *   **Assignments**: Assign at least two test users in your provider to this application (e.g., `sso_new_user@yourdomain.com` and `sso_existing_user@yourdomain.com`).
2.  **Log in to Stagehand** as `globaladmin@test.com` (`ADMIN` of **TechCorp**).
3.  **Navigate to Settings** -> Organization Settings for "TechCorp".
4.  **Configure OIDC Settings**:
    *   Go to the "Single Sign-On (OIDC)" section.
    *   Fill in all the required details from your OIDC application: `Issuer URL`, `Client ID`, `Client Secret`, and the provider-specific `Authorization`, `Token`, and `User Info` URLs.
    *   Set the **"Default Role for New Users"** to `EDITOR`.
    *   Save the configuration.

#### 4.2. Test Case: SP-Initiated Login with a New User (JIT Provisioning)

This tests the flow when a user starts from our login page.

1.  **Log out** from the `globaladmin@test.com` account.
2.  Navigate to the **Login Page**.
3.  Enter the email of a **new** OIDC test user (e.g., `sso_new_user@yourdomain.com`). This user should exist in the IdP but NOT in Stagehand.
4.  **Expected Behavior**: After a brief delay, the password field should disappear, and a "Login with SSO" button should appear.
5.  Click the login button. You should be redirected to your OIDC provider's login page.
6.  Log in with the new test user's credentials on the provider's site.
7.  **Expected Behavior on Redirect**:
    *   You should be redirected back to the Stagehand dashboard.
    *   You are now logged in as `sso_new_user@yourdomain.com`.
    *   A new user should have been created in the database (Just-in-Time Provisioning).
    *   The user should be a member of the **TechCorp** organization with the **`EDITOR`** role, as defined in the `defaultRole` setting.

#### 4.3. Test Case: SP-Initiated Login with an Existing User

This tests linking an SSO login to a pre-existing Stagehand account.

1.  First, ensure the user `projecta21_reader@test.com` exists in your IdP and is assigned to the application.
2.  **Log out** of all accounts.
3.  Navigate to the **Login Page**.
4.  Enter the email `projecta21_reader@test.com`.
5.  Click the "Login with SSO" button and complete authentication with the provider.
6.  **Expected Behavior on Redirect**:
    *   You should be logged in as `projecta21_reader@test.com`.
    *   No new user should be created.
    *   The user's permissions should remain unchanged (they are still a `READER` of the "BlobStore" project). This verifies that SSO login correctly links to an existing account without altering its permissions.

#### 4.4. Test Case: IdP-Initiated Login

This tests the flow when a user starts from their Identity Provider's dashboard.

1.  In a separate browser or incognito window, log into your Identity Provider's dashboard (e.g., Okta) as a test user (e.g., `sso_new_user@yourdomain.com` or another new user).
2.  From the IdP's application dashboard, click on the Stagehand application icon.
3.  **Expected Behavior**:
    *   You should be redirected directly to the Stagehand application and logged in automatically.
    *   If the user did not exist in Stagehand previously, a new user should be created with the `EDITOR` role within the **TechCorp** organization (the org configured for that IdP `issuer`).
    *   If the user already existed, they should simply be logged in.
    *   This flow should work without ever visiting the Stagehand login page.

#### 4.5. Test Case: Disabling OIDC

1.  Log in as `globaladmin@test.com`.
2.  Navigate to the OIDC settings for TechCorp.
3.  Click the **"Delete Configuration"** button.
4.  **Expected Behavior**: The configuration is deleted.
5.  **Log out** and navigate to the login page.
6.  Enter the email of an SSO user (e.g., `sso_new_user@yourdomain.com`).
7.  **Expected Behavior**: The "Login with SSO" button should NOT appear. The login form should behave as a standard password-only form. The user should not be able to log in with their old SSO credentials. 