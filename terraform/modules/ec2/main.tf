data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"] # Canonical's AWS account ID

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }

  filter {
    name   = "root-device-type"
    values = ["ebs"]
  }

  filter {
    name   = "architecture"
    values = ["x86_64"]
  }
}

resource "aws_key_pair" "deployer" {
  key_name_prefix = "${var.project_name}-key"
  public_key      = var.ssh_public_key
}

resource "aws_instance" "app" {
  ami           = data.aws_ami.ubuntu.id
  instance_type = var.instance_type

  subnet_id                   = var.subnet_id
  vpc_security_group_ids      = [var.security_group_id]
  associate_public_ip_address = true
  key_name                   = aws_key_pair.deployer.key_name

  root_block_device {
    volume_size = 50  # Increased for running multiple services
    volume_type = "gp3"
    encrypted   = true
  }

  metadata_options {
    http_endpoint = "enabled"
    http_tokens   = "required" # IMDSv2
  }

  user_data = <<-EOF
              #!/bin/bash
              # Update system
              apt-get update
              apt-get upgrade -y

              # Create and enable swap
              fallocate -l 6G /swapfile
              chmod 600 /swapfile
              mkswap /swapfile
              swapon /swapfile
              echo '/swapfile none swap sw 0 0' | tee -a /etc/fstab

              # Set swappiness
              echo 'vm.swappiness=10' | tee -a /etc/sysctl.conf
              sysctl -p

              # Install required packages
              apt-get install -y \
                apt-transport-https \
                ca-certificates \
                curl \
                gnupg \
                lsb-release \
                git \
                nfs-common

              # Install Docker
              curl -fsSL https://get.docker.com -o get-docker.sh
              sh get-docker.sh

              # Install Docker Compose
              curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
              chmod +x /usr/local/bin/docker-compose

              # Create docker user group and add ubuntu user
              usermod -aG docker ubuntu

              # Create directories for services
              mkdir -p /opt/radhe/{traefik,data}
              chown -R ubuntu:ubuntu /opt/radhe

              # Mount EFS for Traefik certificates
              mkdir -p /mnt/efs/traefik
              echo "${var.efs_dns_name}:/ /mnt/efs/traefik nfs4 nfsvers=4.1,rsize=1048576,wsize=1048576,hard,timeo=600,retrans=2,noresvport 0 0" >> /etc/fstab
              mount -a
              
              # Create Docker volume directory and set permissions
              mkdir -p /var/lib/docker/volumes/traefik/_data
              # Wait for EFS mount to be ready
              sleep 10
              # Create traefik directory in EFS if it doesn't exist
              mkdir -p /mnt/efs/traefik/acme
              # Set permissions
              chown -R 1000:1000 /mnt/efs/traefik
              chmod -R 755 /mnt/efs/traefik
              
              # Create symlink for Docker volume
              rm -rf /var/lib/docker/volumes/traefik/_data
              ln -sf /mnt/efs/traefik /var/lib/docker/volumes/traefik/_data

              # Install basic monitoring tools
              apt-get install -y \
                htop \
                iotop \
                net-tools \
                tcpdump \
                nmap
              EOF

  tags = {
    Name        = "${var.project_name}-instance"
    Environment = var.environment
  }
}