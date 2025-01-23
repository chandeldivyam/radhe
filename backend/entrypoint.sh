#!/bin/bash

echo "Checking for database schema changes..."

# Generate migrations if there are changes
alembic revision --autogenerate -m "auto migration" || echo "No schema changes detected"

# Apply any pending migrations
alembic upgrade head

# Check if we're in development mode (debugpy is installed)
if pip list | grep -q debugpy; then
    echo "Starting backend in development mode..."
    exec python -m debugpy --listen 0.0.0.0:5679 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
else
    echo "Starting backend in production mode..."
    exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
fi