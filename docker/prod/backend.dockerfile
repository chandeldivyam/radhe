FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY ./backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY ./backend /app
COPY ./.env /app/.env

# Copy Alembic configuration and migrations
COPY ./backend/alembic.ini .
COPY ./backend/app/alembic ./app/alembic

# Copy production entrypoint script
COPY ./backend/entrypoint.prod.sh .
RUN chmod +x ./entrypoint.prod.sh

CMD ["./entrypoint.prod.sh"]