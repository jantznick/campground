# How to Reset and Reseed the Database

This guide provides the steps to completely reset the Docker environment, consolidate all database schema changes into a single migration, and seed the database with fresh test data.

## When to Use This

Use this process when your local Docker or database state becomes corrupted, or when you want to start fresh with a clean, seeded database for testing.

## The Process

Execute these commands from the root of the project directory.

### Step 1: Stop and Purge All Docker Services

This command stops all running containers and completely removes them, their associated networks, and crucially, the database volume (`-v` flag), which deletes all existing data.

```bash
docker-compose down -v
```

### Step 2: Delete Old Migration Files

Before creating a new consolidated migration, you must delete the old migration history.

```bash
rm -rf packages/api/prisma/migrations
```

### Step 3: Build and Start Fresh Services

This command rebuilds the container images and starts all services (including the database) in detached mode (`-d`).

```bash
docker-compose up --build -d
```
*Note: Wait a few moments for the database container to fully initialize before proceeding to the next step.*

### Step 4: Create a New Consolidated Migration

This command runs `prisma migrate` *inside* the `api` container. It compares your `schema.prisma` file with the empty database state and creates a single `init` migration file that represents the entire schema.

*We use `docker-compose exec` and an absolute path to the schema to avoid network and pathing issues.*

```bash
docker-compose exec api npx prisma migrate dev --name init --schema=/app/packages/api/prisma/schema.prisma
```

### Step 5: Seed the Database

This command directly executes the `seed.js` script using `node` inside the `api` container. This is more reliable than `npx prisma db seed` as it avoids potential pathing issues with the Prisma CLI.

```bash
docker-compose exec api node /app/packages/api/prisma/seed.js
```

Your environment is now fully reset, running, and populated with test data. 