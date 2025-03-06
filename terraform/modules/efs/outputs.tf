output "efs_id" {
    value       = aws_efs_file_system.cert_storage.id
    description = "ID of the EFS file system"
  }
  
  output "efs_dns_name" {
    value       = aws_efs_file_system.cert_storage.dns_name
    description = "DNS name of the EFS file system"
  }
  
  output "efs_access_point_id" {
    value       = aws_efs_access_point.cert_access_point.id
    description = "ID of the EFS access point"
  }
  
  output "efs_security_group_id" {
    value       = aws_security_group.efs_sg.id
    description = "ID of the EFS security group"
  }