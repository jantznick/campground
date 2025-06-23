#!/bin/sh

# Exit immediately if a command exits with a non-zero status.
set -e

echo "Installing API dependencies..."
npm install --workspace=api

echo "Installing email dependencies..."
npm install --workspace=@campground/emails

# echo "Building email templates..."
# npm run build -w @campground/emails

echo "Running database migrations..."
npx prisma migrate deploy --schema=packages/api/prisma/schema.prisma

echo "Starting API server..."
npm run dev --workspace=api 