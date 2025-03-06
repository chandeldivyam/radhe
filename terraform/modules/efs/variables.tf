variable "project_name" {
    type        = string
    description = "Project name to be used for resource naming"
  }
  
  variable "environment" {
    type        = string
    description = "Environment name"
  }
  
  variable "vpc_id" {
    type        = string
    description = "VPC ID where the EFS will be created"
  }
  
  variable "subnet_id" {
    type        = string
    description = "Subnet ID where the EFS mount target will be created"
  }
  
  variable "security_group_id" {
    type        = string
    description = "Security group ID for the EC2 instance"
  }