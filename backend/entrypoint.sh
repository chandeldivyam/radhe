#!/bin/bash

echo "Checking for database schema changes..."

# Initial migration
alembic revision --autogenerate -m "auto migration" || echo "No schema changes detected"
# Apply any pending migrations
if alembic upgrade head; then
    echo "Database migrations applied successfully."
else
    echo "Error applying database migrations."
    exit 1
fi

# Start the file watcher in background
(
    while inotifywait -e modify,create,delete -r /app/app/models/; do
        echo "Model changes detected, running migrations..."
        alembic revision --autogenerate -m "auto migration"
        alembic upgrade head
    done
) &

# Start the application
exec python -m debugpy --listen 0.0.0.0:5679 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload