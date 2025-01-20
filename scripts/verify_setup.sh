#!/bin/bash
echo "Verifying project setup..."

# Check if .env exists
if [ ! -f .env ]; then
    echo "Creating .env file..."
    cp .env.example .env
fi

# Create any missing directories
mkdir -p backend/alembic/versions