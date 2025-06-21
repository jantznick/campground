# Campground

### Ship Your SaaS, Not Your Scaffolding

Campground is a production-ready, open-source boilerplate for building scalable, multi-tenant web applications. It comes with a complete, modern tech stack and pre-built features like a flexible hierarchy, role-based permissions, and user authentication, so you can focus on building what matters most: your product.

This project is designed to give you a massive head start when developing a SaaS application that requires sophisticated tenancy and permission models.

This project was built largely with cursor on Gemini 2.5 Pro model and mostly monitored, refactored and approved by a senior level developer. There are some definite pieces of bad code in here, however everything seems to be functioning as expected. 

---

## Core Features

Campground provides a robust foundation with all the essential features needed for a modern multi-tenant application.

*   **Flexible Multi-Tenant Hierarchies:**
    *   Model complex organizational structures right out of the box: **Organizations → Companies → Teams → Projects**.
    *   The hierarchy is fully customizable, allowing you to rename levels to fit your specific domain needs (e.g., "Schools" instead of "Companies").
    *   The top-level "Organization" can be toggled on or off depending on your business requirements.

*   **Role-Based Access Control (RBAC):**
    *   A granular permission system is built-in with default roles: **Admin**, **Editor**, and **Reader**.
    *   Permissions are hierarchical, meaning roles at a higher level (like a Company) grant access to all nested resources (like Teams and Projects within it).
    *   A secure middleware layer on the backend enforces all permission checks for every API request.

*   **User Authentication & Onboarding:**
    *   **Secure Authentication:** Features a complete, session-based authentication system.
    *   **Invite System:** Effortlessly onboard new users with invite links. Invitations can pre-configure a user's role and access level before they even sign up.
    *   **Automatic Domain Join:** Automatically assign new users to the correct Organization or Company based on their email domain, with built-in DNS verification for security.

*   **Ready-to-Deploy:**
    *   The entire application is containerized with Docker.
    *   Get a full development environment running locally—including the database—with a single command: `docker-compose up`.

## Coming Soon Features

 **OIDC & SSO:** Designed to easily integrate with identity providers like Okta, Auth0, or any other OIDC-compliant service for seamless enterprise login
 
 **Email Capabilities:** Email notifications and other transaction email needs
 
 **User Notification System:** A general user notification system

---

## Tech Stack

Campground is built with a modern, reliable, and no-nonsense tech stack chosen for developer productivity and scalability.

| Category      | Technology                                                                                                                              |
|---------------|-----------------------------------------------------------------------------------------------------------------------------------------|
| **Backend**       | **Node.js**, **Express.js**, **Prisma** (ORM for PostgreSQL)                                                                            |
| **Frontend**      | **React**, **Vite**, **Zustand** (for state management), **Tailwind CSS** (with Headless UI & Catalyst components)                      |
| **Database**      | **PostgreSQL**                                                                                                                          |
| **Dev & Tooling** | **Docker** & **Docker Compose**, **NPM Workspaces** (Monorepo), **ESLint**, **Prettier**                                                    |

---

## Getting Started

You can get a local instance of Campground running in minutes.

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/jantznick/campground.git
    cd campground
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up environment variables:**
    ```bash
    cp .env.example .env
    ```
    *You can customize your database connection and other settings in the newly created `.env` file.*

4.  **Start the application:**
    ```bash
    docker-compose up
    ```

This will start the backend API server, the frontend Vite development server, and the PostgreSQL database. The application will be available at `http://localhost:3000`.

---

## Project Philosophy

The goal of Campground is to handle the complex, repetitive, and critical foundation of a multi-tenant SaaS application so that individual developers and teams can build and ship their unique products faster. PRs are welcome.
