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