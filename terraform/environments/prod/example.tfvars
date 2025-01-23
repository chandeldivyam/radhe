project_name     = "radhe"
aws_region       = "us-east-1"
environment      = "prod"

# Network Configuration
vpc_cidr           = "10.0.0.0/16"
public_subnet_cidr = "10.0.1.0/24"
ssh_allowed_cidr   = ["0.0.0.0/0"]  # TODO: Replace with your specific IP range for security

# EC2 Configuration
instance_type    = "t3.small"
ssh_public_key   = "ssh-rsa AAAA..."