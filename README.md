# radhe

## How to run the development mode

1. If we want to run with flower `docker-compose -f docker-compose.dev.yml --profile flower up --build`

2. If we want to run without flower `docker-compose -f docker-compose.dev.yml up --build`

3. `docker-compose -f docker-compose.dev.yml down` to remove the containers, we can also use `docker-compose -f docker-compose.dev.yml down -v` to remove containers and volumes

4. This will run without flower and show logs only for frontend and backend
```
docker-compose -f docker-compose.dev.yml up --build -d
docker-compose -f docker-compose.dev.yml logs -f frontend backend
```
