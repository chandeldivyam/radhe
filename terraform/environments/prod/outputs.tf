output "instance_public_ip" {
    value = module.ec2.public_ip
  }
  
  output "instance_public_dns" {
    value = module.ec2.public_dns
  }