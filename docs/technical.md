# Technical Specifications

This document details the technical stack, tools, and standards for the project.

## Technology Stack

*   **Package Manager:** `npm` will be used for managing the monorepo workspaces and dependencies due to its efficiency with disk space and installation speed.
*   **Backend:**
    *   **Framework:** Node.js with Express.js.
    *   **Language:** JavaScript (ESM).
    *   **Authentication:** Session token based authentication via the PostgresDB.
*   **Frontend:**
    *   **Framework:** React 18.
    *   **Build Tool:** Vite.
    *   **Styling:** Tailwind CSS v4.
    *   **UI Components:** Headless UI for unstyled, accessible components. For more complex elements, we will use **Catalyst**, the official component library from the Tailwind CSS team. We will favor building from these primitives before introducing other third-party component libraries.
    *   **State Management:** Zustand for global client-side state.
*   **Database:**
    *   **Engine:** PostgreSQL.
    *   **Interaction:** We will use **Prisma** as our ORM for all database interactions, schema management, and migrations.
*   **Development & Deployment:**
    *   **Containerization:** Docker & Docker Compose.

## Coding Standards

*   **Linting:** ESLint with recommended rule sets for Node.js, React, and Accessibility.
*   **Formatting:** Prettier will be used to ensure consistent code style across the entire codebase. A `.prettierrc` file will be configured in the project root.
*   **API:** The backend will expose a RESTful API. All API routes will be versioned (e.g., `/api/v1/...`).

## Color Palette

The application UI will adhere to the following color palette as defined in `readme.md`:

*   `--prussian-blue: #003049ff;`
*   `--fire-engine-red: #d62828ff;`
*   `--orange-wheel: #f77f00ff;`
*   `--xanthous: #fcbf49ff;`
*   `--vanilla: #eae2b7ff;` 