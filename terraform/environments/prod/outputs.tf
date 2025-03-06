output "instance_public_ip" {
    value = module.ec2.public_ip
  }
  
  output "instance_public_dns" {
    value = module.ec2.public_dns
  }

  output "efs_id" {
    value = module.efs.efs_id
  }
  
  output "efs_dns_name" {
    value = module.efs.efs_dns_name
  }