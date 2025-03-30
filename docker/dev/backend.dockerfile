FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    postgresql-client \
    inotify-tools \
    python3-opencv \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY ./backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install debugpy watchdog

# Copy Alembic configuration
COPY ./backend/alembic.ini .
COPY ./backend/app/alembic ./app/alembic

# Copy entrypoint script
COPY ./backend/entrypoint.sh .
RUN chmod +x ./entrypoint.sh

# Create versions directory
RUN mkdir -p /app/alembic/versions

# Use entrypoint script
CMD ["./entrypoint.sh"]