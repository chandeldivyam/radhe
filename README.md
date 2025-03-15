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
7. To exec into database container `docker compose -f docker-compose.dev.yml exec db psql -U ${POSTGRES_USER} -d ${POSTGRES_DB}`
8. To restart the frontend after installing dependencies `docker compose -f docker-compose.dev.yml up -d --build frontend`

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

0. After getting into the aws ec2
1. Create relevant A records for the domain. For ease, we can create A record with * to point to the IP address of the instance. We can check this by using the command `dig +short app.domain.com` -> this should point to the IP address of the instance.
2. Clone the repo: `https://github.com/chandeldivyam/radhe.git`
3. `cd radhe`
4. Create a .env file in root directory -- Check .env.example for reference
5. Create a .env.production file in frontend directory -- Check frontend/.env.example for reference
6. Create a .env file for collaboration_service
7. Run the docker compose file
```
docker-compose -f docker-compose.prod.yml up --build -d
```