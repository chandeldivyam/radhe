output "instance_public_ip" {
    value = module.ec2.public_ip
  }
  
  output "instance_public_dns" {
    value = module.ec2.public_dns
  }

output "cert_volume_id" {
  description = "The ID of the certificate EBS volume"
  value       = module.ebs.cert_volume_id
}

output "postgres_volume_id" {
  description = "The ID of the PostgreSQL EBS volume" 
  value       = module.ebs.postgres_volume_id
}

output "minio_volume_id" {
  description = "The ID of the MinIO EBS volume"
  value       = module.ebs.minio_volume_id
}
