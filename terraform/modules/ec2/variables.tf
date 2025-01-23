variable "project_name" {
    type        = string
    description = "Project name to be used for resource naming"
  }
  
  variable "environment" {
    type        = string
    description = "Environment name"
  }
  
  variable "instance_type" {
    type        = string
    description = "EC2 instance type"
  }
  
  variable "subnet_id" {
    type        = string
    description = "Subnet ID where the instance will be launched"
  }
  
  variable "security_group_id" {
    type        = string
    description = "Security group ID for the instance"
  }
  
  variable "ssh_public_key" {
    type        = string
    description = "SSH public key for instance access"
  }