#!/bin/bash

# Add initial delay to allow database to start
echo "Waiting for 5 seconds before attempting database connection..."
sleep 5

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