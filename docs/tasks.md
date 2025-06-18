# Development Tasks

This document lists the high-level tasks for building the application.

## Phase 1: Project Setup & Core Infrastructure

- [x] Initialize `pnpm` monorepo with `packages/api` and `packages/web` workspaces.
- [x] Create root `package.json`, `.gitignore`, and Prettier/ESLint configurations.
- [x] Set up `docker-compose.yml` with services for `api`, `web`, and `postgres` database.
- [x] Create basic Express server setup in `packages/api`.
- [x] Create basic React application with Vite in `packages/web`.

## Phase 2: Database & Data Model

- [x] Define the database schema using Prisma.
- [x] Create initial Prisma migration for Users, Orgs, Companies, Teams, Projects, and Roles.
- [ ] Seed the database with initial data if necessary.

## Phase 3: User Authentication

- [x] Implement user registration endpoint.
- [x] Implement user login endpoint that creates a session token in the database and returns it to the client.
- [ ] Implement handling of invite tokens during registration.
- [ ] Create a secure middleware to protect routes by validating the session token against the database.
- [x] Build the frontend Registration and Login pages.

## Phase 4: Authorization & Multi-Tenancy

- [ ] Create the authorization middleware to check user roles against the resource hierarchy.
- [ ] Implement API endpoints for CRUD operations on Organizations.
- [ ] Implement API endpoints for CRUD operations on Companies.
- [ ] Implement API endpoints for CRUD operations on Teams.
- [ ] Implement API endpoints for CRUD operations on Projects.

## Phase 5: Frontend Implementation

- [ ] Build the main application layout (sidebar, header, content area).
- [ ] Implement global state management for user and tenant information with Zustand.
- [ ] Create UI for viewing and managing Organizations.
- [ ] Create UI for viewing and managing Companies.
- [ ] Create UI for viewing and managing Teams.
- [ ] Create UI for viewing and managing Projects.
- [ ] Implement the "hide Organization" toggle in settings. 