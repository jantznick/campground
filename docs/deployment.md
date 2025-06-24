# Application Deployment Guide

This guide outlines two primary strategies for deploying the application for a demo or production environment.

## Strategy 1: Single Server with Docker Compose (Recommended for Simplicity)

This approach packages the entire application (web, API, database, and a data seeder) into a single `docker-compose.prod.yml` file. It's the simplest method to get a self-contained demo environment running on any server with Docker.

### Prerequisites

- Git
- Docker Engine
- Docker Compose

### Setup & Deployment Steps

**1. Clone the Repository**

```bash
git clone <your-repository-url>
cd campground
```

**2. Configure Environment Variables**

The application requires several environment variables to run. A template is provided in `.env.example`.

First, copy the template to a new `.env` file:

```bash
cp .env.example .env
```

Next, open the `.env` file and **change the default values**, especially the security keys.

- `WEB_URL`: For running the demo on your local machine, `http://localhost` is fine. If deploying to a server, change this to your server's public domain name.
- `API_URL`: Set this to the public URL for the API. For a local demo, `http://localhost:3001` is correct.
- `SESSION_SECRET`: **Change this.** Generate a new one with the command:
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```
- `ENCRYPTION_KEY`: **Change this.** This MUST be a 64-character hex string. Generate a new one with:
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```
- `RESEND_API_KEY`: Add your API key from [Resend](https://resend.com) to enable email features like magic links and invitations.

**3. Build and Run the Application**

Use the `docker-compose.prod.yml` file to build the production images and start the services in detached mode:

```bash
docker-compose -f docker-compose.prod.yml up --build -d
```

The initial build may take a few minutes. Subsequent startups will be much faster.

**4. Accessing the Demo**

Once the containers are running, you can access the application in your browser:

- **Web Application:** [http://localhost](http://localhost) (or your configured `WEB_URL`)
- **API:** [http://localhost:3001](http://localhost:3001)

### Automated Database Reseeding

The production Docker Compose setup includes a `seeder` service. This service automatically resets and reseeds the database every hour using the `packages/api/prisma/seed.js` script. This ensures your demo environment remains fresh for new users.

---

## Strategy 2: Cloud Platform (e.g., Render, Fly.io)

For a more robust, scalable, and hands-off solution, you can deploy the application services to a cloud platform like [Render](https://render.com) or [Fly.io](https://fly.io).

The high-level steps are:

1.  **Containerize:** The `packages/api/Dockerfile.prod` and `packages/web/Dockerfile.prod` files are already prepared for this. You can point your cloud provider to these Dockerfiles in your repository.
2.  **Create Services:**
    - Create a **Web Service** for the `web` application.
    - Create a **Web Service** for the `api` application.
    - Create a **Managed PostgreSQL Database**.
3.  **Configure Environment:** Use the cloud platform's secrets/environment variable management to set the same variables as in the `.env` file (`DATABASE_URL`, `WEB_URL`, `SESSION_SECRET`, etc.). The platform will provide the `DATABASE_URL` for your managed database.
4.  **Set up Reseeding:** Use the platform's "Cron Job" or "Scheduled Job" feature to run the seed command on a schedule (e.g., hourly). The command would be `node packages/api/prisma/seed.js`.

This approach offloads infrastructure management and provides features like auto-scaling, pull request previews, and more. 