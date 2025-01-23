variable "aws_region" {
    type        = string
    description = "AWS region"
    default     = "us-east-1"
  }
  
  variable "project_name" {
    type        = string
    description = "Project name to be used for resource naming"
  }
  
  variable "environment" {
    type        = string
    description = "Environment name"
    default     = "prod"
  }
  
  variable "vpc_cidr" {
    type        = string
    description = "CIDR block for VPC"
    default     = "10.0.0.0/16"
  }
  
  variable "public_subnet_cidr" {
    type        = string
    description = "CIDR block for public subnet"
    default     = "10.0.1.0/24"
  }
  
  variable "ssh_allowed_cidr" {
    type        = list(string)
    description = "List of CIDR blocks allowed to SSH into the instance"
  }
  
  variable "instance_type" {
    type        = string
    description = "EC2 instance type"
    default     = "t3.small"
  }
  
  variable "ssh_public_key" {
    type        = string
    description = "SSH public key for instance access"
  }