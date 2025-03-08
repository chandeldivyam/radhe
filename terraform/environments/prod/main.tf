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
  
locals {
  cert_device_name     = "/dev/sdf"
  postgres_device_name = "/dev/sdg"
  minio_device_name    = "/dev/sdh"
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

module "ebs" {
  source = "../../modules/ebs"

  project_name      = var.project_name
  environment       = var.environment
  availability_zone = "${var.aws_region}a"
  
  # Remove the instance_id from here
  # instance_id       = module.ec2.instance_id
  
  cert_device_name     = local.cert_device_name
  postgres_device_name = local.postgres_device_name
  minio_device_name    = local.minio_device_name
}

module "ec2" {
    source = "../../modules/ec2"
  
    project_name      = var.project_name
    environment       = var.environment
    instance_type     = var.instance_type
    subnet_id         = module.networking.public_subnet_id
    security_group_id = module.networking.security_group_id
    ssh_public_key    = var.ssh_public_key
    
    # Use local variables for device names
    cert_device_name     = local.cert_device_name
    postgres_device_name = local.postgres_device_name
    minio_device_name    = local.minio_device_name
}

# Add this section to create the attachments after both EC2 and EBS resources exist
resource "aws_volume_attachment" "cert_attachment" {
  device_name = local.cert_device_name
  volume_id   = module.ebs.cert_volume_id
  instance_id = module.ec2.instance_id
}

resource "aws_volume_attachment" "postgres_attachment" {
  device_name = local.postgres_device_name
  volume_id   = module.ebs.postgres_volume_id
  instance_id = module.ec2.instance_id
}

resource "aws_volume_attachment" "minio_attachment" {
  device_name = local.minio_device_name
  volume_id   = module.ebs.minio_volume_id
  instance_id = module.ec2.instance_id
}