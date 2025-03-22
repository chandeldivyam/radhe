#!/bin/bash

echo "Checking for database schema changes..."

# Apply any pending migrations
if alembic upgrade head; then
    echo "Database migrations applied successfully."
else
    echo "Error applying database migrations."
    exit 1
fi

# Start the application
exec python -m debugpy --listen 0.0.0.0:5679 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload