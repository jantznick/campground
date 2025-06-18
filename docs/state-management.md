# State Management & Data Flow

This document provides an overview of the frontend state management, focusing on how data is retrieved, stored, and updated across the application.

---

## 1. The Central Store: `useHierarchyStore`

The application's core data, which includes the user's organization, companies, teams, and projects, is managed in a central Zustand store.

-   **File:** `packages/web/src/stores/useHierarchyStore.js`
-   **Purpose:** To act as the single source of truth for the entire navigation hierarchy and related application state. This prevents prop-drilling and ensures a consistent state across all components.

### Key State Variables:

-   `hierarchy`: An array containing the user's entire organizational structure, starting from the top-level organization. This is the main data object.
-   `activeCompany`: Stores the company object that is currently selected by the user. The main sidebar content (teams and projects) is derived from this object.
-   `accountType`: Stores the plan type (`STANDARD` or `ENTERPRISE`) of the user's organization. This is used to conditionally render UI elements like the `CompanySwitcher`.
-   `selectedItem`: Tracks the specific item (e.g., a single team or project) that is currently selected in the UI, often for highlighting.

---

## 2. Data Retrieval: `fetchHierarchy()`

All data is initially loaded from the server in a single, efficient API call.

-   **Endpoint:** `GET /api/v1/hierarchy`
-   **Trigger:** This function is called from the main `App.jsx` component as soon as the user is authenticated. This ensures the data is available before any other components that need it are rendered.
-   **Function:** `fetchHierarchy()` in `useHierarchyStore.js`.

### The `fetchHierarchy()` Process:

1.  It makes a GET request to the hierarchy endpoint.
2.  Upon receiving the data, it populates the `hierarchy` array in the store.
3.  It intelligently determines the `activeCompany`:
    -   If the account is **STANDARD**, it uses the `defaultCompanyId` set on the organization to find and set the active company.
    -   If the account is **ENTERPRISE**, it attempts to preserve the user's current selection. If that's not possible (e.g., on first load), it defaults to the first company in the list.
4.  It also determines and stores the organization's `accountType`.

---

## 3. Component Data Access

Components do not fetch data themselves. Instead, they subscribe to the `useHierarchyStore` to access the state they need.

-   **`Sidebar.jsx`:** Subscribes to get the `accountType` to know whether to render the `CompanySwitcher`.
-   **`HierarchySection.jsx`:** Subscribes to get the `hierarchy` and `activeCompany`. It uses this to get the organization's name for its header and to render the list of teams from the `activeCompany`.
-   **`CompanySwitcher.jsx`:** Subscribes to get the full `hierarchy` (to list all companies), the `activeCompany`, and the `setActiveCompany` function.
-   **`DashboardPage.jsx`:** (And other main content pages) Can subscribe to the store to get details about the `selectedItem` or `activeCompany` to display relevant data.

---

## 4. State Updates (Mutations)

When data is changed (e.g., creating, updating, or deleting an item), the local state must be synchronized with the database. There are two primary strategies used in the app.

### Strategy 1: Full Refetch (The Simple & Safe Method)

-   **How it Works:** After the API call succeeds, the app calls `fetchHierarchy()` again.
-   **When it's Used:**
    -   **Deletion:** Used after deleting any item. This is the safest approach because a deletion can have cascading effects that are complex to replicate locally.
    -   **Creation of Companies:** Currently used after a new company is created.
-   **Pros:** Guarantees the local state is a perfect mirror of the database.
-   **Cons:** Less performant, as it requires a full network round-trip and re-processing of the entire data structure.

### Strategy 2: Local State Update (The Efficient Method)

-   **How it Works:** After the API call succeeds, the new or updated item returned from the server is used to directly and precisely modify the state in the `useHierarchyStore`.
-   **When it's Used:**
    -   **Updating Items:** The `updateItem` function in the store is a perfect example. It finds the specific item in the nested `hierarchy` array and updates its properties without a refetch.
-   **Pros:** Extremely fast and provides an instantaneous UI update. Avoids unnecessary network traffic.
-   **Cons:** Requires more careful implementation to ensure the local state is modified correctly without introducing inconsistencies.
-   **The Current Issue:** As you identified, the creation of **Teams** and **Projects** currently uses the full refetch method. **The recommended fix is to modify this flow to use a local state update**, where the new team/project is appended directly to the `teams` or `projects` array of its parent in the `hierarchy` state. 