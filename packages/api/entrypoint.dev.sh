#!/bin/sh

# Exit immediately if a command exits with a non-zero status.
set -e

echo "Installing API dependencies..."
npm install --workspace=api

echo "Running database migrations..."
npx prisma migrate deploy --schema=packages/api/prisma/schema.prisma

echo "Starting API server..."
npm run dev --workspace=api 