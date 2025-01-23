variable "project_name" {
  type        = string
  description = "Project name to be used for resource naming"
}

variable "environment" {
  type        = string
  description = "Environment name"
}

variable "vpc_cidr" {
  type        = string
  description = "CIDR block for VPC"
}

variable "public_subnet_cidr" {
  type        = string
  description = "CIDR block for public subnet"
}

variable "availability_zone" {
  type        = string
  description = "Availability zone for resources"
}

variable "ssh_allowed_cidr" {
  type        = list(string)
  description = "List of CIDR blocks allowed to SSH into the instance"
}