#!/bin/bash
#
# This script completely resets the Docker environment, consolidates all database
# schema changes into a single migration, and seeds the database with fresh test data.
# It automates the steps outlined in docs/reset-and-reseed-db.md.

# Exit immediately if a command exits with a non-zero status.
set -e

# Change to the script's directory to ensure paths are correct
cd "$(dirname "$0")/.."

echo "---"
echo "STEP 1: Stopping and purging all Docker services and volumes..."
docker-compose down -v
echo "Docker services stopped and purged."
echo "---"

echo "STEP 2: Deleting old migration files..."
rm -rf packages/api/prisma/migrations
echo "Old migrations deleted."
echo "---"

echo "STEP 3: Building and starting fresh services..."
docker-compose up --build -d
echo "Services are starting up..."
echo "Waiting 10 seconds for the database container to initialize..."
sleep 10
echo "---"

echo "STEP 4: Creating a new consolidated 'init' migration..."
docker-compose exec api npx prisma migrate dev --name init --schema=/app/packages/api/prisma/schema.prisma
echo "New migration created."
echo "---"

echo "STEP 5: Seeding the database..."
docker-compose exec api node /app/packages/api/prisma/seed.js
echo "---"
echo "✅ Environment has been successfully reset and seeded!"
echo "---" 