# terraform/modules/ebs/outputs.tf
output "cert_volume_id" {
  description = "The ID of the certificate EBS volume"
  value       = aws_ebs_volume.cert_volume.id
}

output "postgres_volume_id" {
  description = "The ID of the PostgreSQL EBS volume"
  value       = aws_ebs_volume.postgres_volume.id
}

output "minio_volume_id" {
  description = "The ID of the MinIO EBS volume"
  value       = aws_ebs_volume.minio_volume.id
}

output "cert_device_name" {
  description = "The device name for the certificate volume"
  value       = var.cert_device_name
}

output "postgres_device_name" {
  description = "The device name for the PostgreSQL volume"
  value       = var.postgres_device_name
}

output "minio_device_name" {
  description = "The device name for the MinIO volume"
  value       = var.minio_device_name
}