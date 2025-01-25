# radhe

## How to run the development mode

1. Create a .env file in root directory -- Check .env.example for reference
2. Create a .env.local file in frontend directory -- Check frontend/.env.example for reference
3. If we want to run with flower `docker-compose -f docker-compose.dev.yml --profile flower up --build`
4. If we want to run without flower `docker-compose -f docker-compose.dev.yml up --build`
5. `docker-compose -f docker-compose.dev.yml down` to remove the containers, we can also use `docker-compose -f docker-compose.dev.yml down -v` to remove containers and volumes
6. This will run without flower and show logs only for frontend and backend
```
docker-compose -f docker-compose.dev.yml up --build -d
docker-compose -f docker-compose.dev.yml logs -f frontend backend
```

# How to setup infrastructure

1. Commands to Setup AWS account
```
export AWS_ACCESS_KEY_ID='your_access_key'
export AWS_SECRET_ACCESS_KEY='your_secret_key'
```

2. Setup terraform.tfvars file in terraform/environments/prod

3. Commands to Setup Terraform
```
cd terraform/environments/prod
terraform init
terraform plan -var-file=terraform.tfvars
terraform apply -var-file=terraform.tfvars
```

4. ssh into the instance
```
ssh -i ~/.ssh/radhe-prod.pem ubuntu@12.87.11.11
```

# How to run the production mode

1. Create a .env file in root directory -- Check .env.example for reference
2. Create a .env.production file in frontend directory -- Check frontend/.env.example for reference
3. Run the docker compose file
```
docker-compose -f docker-compose.prod.yml up --build -d
```