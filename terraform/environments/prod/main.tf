terraform {
    required_version = ">= 1.0.0"
  
    required_providers {
      aws = {
        source  = "hashicorp/aws"
        version = "~> 5.0"
      }
    }
}
  
provider "aws" {
    region = var.aws_region
  
    default_tags {
      tags = {
        Project     = var.project_name
        Environment = var.environment
        Terraform   = "true"
      }
    }
}
  
module "networking" {
    source = "../../modules/networking"
  
    project_name       = var.project_name
    environment        = var.environment
    vpc_cidr          = var.vpc_cidr
    public_subnet_cidr = var.public_subnet_cidr
    availability_zone  = "${var.aws_region}a"
    ssh_allowed_cidr   = var.ssh_allowed_cidr
}
  
module "ec2" {
    source = "../../modules/ec2"
  
    project_name      = var.project_name
    environment       = var.environment
    instance_type     = var.instance_type
    subnet_id         = module.networking.public_subnet_id
    security_group_id = module.networking.security_group_id
    ssh_public_key    = var.ssh_public_key
}