# radhe

## How to run the development mode
- Setup .env first
```
# Database
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=app
POSTGRES_HOST=db
POSTGRES_PORT=5432

# Backend
BACKEND_CORS_ORIGINS=["http://localhost:3000"]
SECRET_KEY=your-secret-key-here
PROJECT_NAME=radhe

# S3/MinIO
MINIO_ROOT_USER=minio
MINIO_ROOT_PASSWORD=minio123
MINIO_HOST=minio
MINIO_PORT=9000

# Redis
REDIS_HOST=redis
REDIS_PORT=6379

# Opensearch
OPENSEARCH_HOST=opensearch
OPENSEARCH_PORT=9200

# Flower
ENABLE_FLOWER=true
FLOWER_PORT=5555
FLOWER_USER=admin
FLOWER_PASSWORD=your_secure_password
```

1. If we want to run with flower `docker-compose -f docker-compose.dev.yml --profile flower up --build`

2. If we want to run without flower `docker-compose -f docker-compose.dev.yml up --build`

3. `docker-compose -f docker-compose.dev.yml down` to remove the containers, we can also use `docker-compose -f docker-compose.dev.yml down -v` to remove containers and volumes
