#!/bin/bash

# Check if required environment variables are set
if [ -z "$POSTGRES_PASSWORD" ] || [ -z "$POSTGRES_HOST" ] || [ -z "$POSTGRES_USER" ] || [ -z "$POSTGRES_DB" ]; then
    echo "Error: Required database environment variables are not set"
    echo "Please ensure POSTGRES_PASSWORD, POSTGRES_HOST, POSTGRES_USER and POSTGRES_DB are set"
    exit 1
fi

# Wait for database to be ready
until PGPASSWORD=$POSTGRES_PASSWORD psql -h "$POSTGRES_HOST" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c '\q'; do
  echo "Postgres is unavailable - sleeping"
  sleep 1
done

echo "Applying database migrations..."
alembic upgrade head

# Start the application with production server (using gunicorn)
exec gunicorn app.main:app \
    --bind 0.0.0.0:8000 \
    --workers 4 \
    --worker-class uvicorn.workers.UvicornWorker \
    --access-logfile - \
    --error-logfile -