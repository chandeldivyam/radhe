#!/bin/bash

echo "Checking for database schema changes..."

# Generate migrations if there are changes
alembic revision --autogenerate -m "auto migration" || echo "No schema changes detected"

# Apply any pending migrations
alembic upgrade head

# Start the application
exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload