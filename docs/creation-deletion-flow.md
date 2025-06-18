# Creation & Deletion Flow

This document outlines the process for creating and deleting the core entities in the application: Companies, Teams, and Projects.

---

## 1. Entity Creation

The creation process for all entities follows a similar pattern: a user action triggers a modal, which submits data to a specific API endpoint. The backend validates permissions before creating the new entity.

### 1.1. Creating a Company

-   **Trigger:** The "Add New Company" button inside the `CompanySwitcher` component's popover. This is only available for **ENTERPRISE** accounts.
-   **UI Flow:**
    1.  The button transforms into an input field (`CompanySwitcher.jsx`).
    2.  The user enters the new company's name and submits.
-   **API Call:**
    -   **Endpoint:** `POST /api/v1/companies`
    -   **Payload:** `{ "name": "New Company Name", "organizationId": "org_id_of_active_company" }`
    -   **Permissions (Backend):** The user must have an `ADMIN` role in the parent `Organization` to create a company within it.
-   **State Update:** Upon a successful API response, the frontend calls `fetchHierarchy()` to get the latest data structure, and the newly created company is set as the `activeCompany` in the `useHierarchyStore`.

### 1.2. Creating a Team

-   **Trigger:** The `+` button in the "Teams" header within the `HierarchySection.jsx` component.
-   **UI Flow:**
    1.  Clicking the button opens the `CreateItemModal.jsx`.
    2.  The modal is configured for the `TEAM` item type and captures the name and description.
-   **API Call:**
    -   **Endpoint:** `POST /api/v1/teams`
    -   **Payload:** `{ "name": "New Team Name", "description": "...", "companyId": "active_company_id" }`
    -   **Permissions (Backend):** The user must have an `ADMIN` or `EDITOR` role in the parent `Company`. The user who creates the team is automatically granted the `ADMIN` role for that new team.
-   **State Update (Current Issue):** The `onSuccess` callback in the modal currently triggers a full `fetchHierarchy()` refetch. As you noted, this is inefficient and can lead to UI sync issues. The recommended approach is to update the state locally.

### 1.3. Creating a Project

-   **Trigger:** The `+` button within an expanded `TeamItem.jsx` component.
-   **UI Flow:**
    1.  Clicking the button opens the `CreateItemModal.jsx`.
    2.  The modal is configured for the `PROJECT` item type, capturing name and description.
-   **API Call:**
    -   **Endpoint:** `POST /api/v1/projects`
    -   **Payload:** `{ "name": "New Project Name", "description": "...", "teamId": "parent_team_id" }`
    -   **Permissions (Backend):** The user must have an `ADMIN` or `EDITOR` role in the parent `Team`. The creator is automatically made an `ADMIN` of the new project.
-   **State Update (Current Issue):** Similar to team creation, this process currently relies on a full `fetchHierarchy()` refetch, which should be updated to a local state manipulation for better performance and reliability.

---

## 2. Entity Deletion

Deletion is handled exclusively from the `SettingsPage.jsx` for the respective entity. It is a protected action that requires confirmation.

### 2.1. Deleting a Company, Team, or Project

-   **Trigger:** The "Delete" button within the "Danger Zone" on the `SettingsPage`. This page is accessed via the settings icon next to the item's name in the sidebar.
-   **UI Flow:**
    1.  The settings page is loaded for the specific item (e.g., `/settings/team/team_id`).
    2.  The "Danger Zone" is only visible for `company`, `team`, and `project` types (not `organization`).
    3.  Clicking the "Delete" button reveals a final confirmation button.
    4.  Clicking the confirmation button triggers the API call.
-   **API Calls:**
    -   **Company:** `DELETE /api/v1/companies/:id`
    -   **Team:** `DELETE /api/v1/teams/:id`
    -   **Project:** `DELETE /api/v1/projects/:id`
-   **Permissions (Backend):** For all three entities, the user must have an `ADMIN` role for that specific item to be authorized to delete it. The database is configured with cascading deletes, so deleting a `Company` will also delete all `Teams` and `Projects` within it.
-   **State Update:** Upon a successful deletion, the app calls `fetchHierarchy()` to ensure the entire state is consistent with the database and then navigates the user back to the `/dashboard`. This is an appropriate use of a full refetch, as deletion has wide-reaching effects on the data structure. 