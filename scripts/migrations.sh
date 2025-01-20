#!/bin/bash

# Function to run alembic commands inside the backend container
run_alembic() {
    docker-compose -f docker-compose.dev.yml exec backend alembic "$@"
}

case "$1" in
    "create")
        # Create a new migration
        run_alembic revision --autogenerate -m "$2"
        ;;
    "up")
        # Run all pending migrations
        run_alembic upgrade head
        ;;
    "down")
        # Rollback last migration
        run_alembic downgrade -1
        ;;
    "history")
        # Show migration history
        run_alembic history
        ;;
    *)
        echo "Usage: $0 {create|up|down|history}"
        echo "  create <message>  - Create a new migration"
        echo "  up               - Run all pending migrations"
        echo "  down             - Rollback last migration"
        echo "  history          - Show migration history"
        exit 1
esac