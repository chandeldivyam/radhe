# terraform/modules/ebs/variables.tf
variable "project_name" {
  description = "The name of the project"
  type        = string
}

variable "environment" {
  description = "The environment (e.g., dev, prod)"
  type        = string
}

variable "availability_zone" {
  description = "The availability zone for the EBS volumes"
  type        = string
}

variable "instance_id" {
  description = "The ID of the EC2 instance to attach volumes to"
  type        = string
  default     = ""  # Make it optional
}

variable "cert_device_name" {
  description = "The device name for the certificate volume"
  type        = string
  default     = "/dev/sdf"
}

variable "postgres_device_name" {
  description = "The device name for the PostgreSQL volume"
  type        = string
  default     = "/dev/sdg"
}

variable "minio_device_name" {
  description = "The device name for the MinIO volume"
  type        = string
  default     = "/dev/sdh"
}