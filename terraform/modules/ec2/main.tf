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

              # Format and mount PostgreSQL volume if not already formatted
              if [ ! -b /dev/sdf1 ]; then
                mkfs -t ext4 /dev/sdf
              fi
              mkdir -p /mnt/postgres_data
              mount /dev/sdf /mnt/postgres_data
              echo '/dev/sdf /mnt/postgres_data ext4 defaults,nofail 0 2' >> /etc/fstab

              # Format and mount MinIO volume if not already formatted
              if [ ! -b /dev/sdg1 ]; then
                mkfs -t ext4 /dev/sdg
              fi
              mkdir -p /mnt/minio_data
              mount /dev/sdg /mnt/minio_data
              echo '/dev/sdg /mnt/minio_data ext4 defaults,nofail 0 2' >> /etc/fstab

              # Set correct permissions
              mkdir -p /mnt/postgres_data/pgdata
              chown -R 1000:1000 /mnt/postgres_data/pgdata
              chmod 700 /mnt/postgres_data/pgdata

              chown -R 1000:1000 /mnt/minio_data

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
                git

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

# EBS volume for PostgreSQL
resource "aws_ebs_volume" "postgres_data" {
    availability_zone = aws_instance.app.availability_zone
    size             = 20  # Size in GB
    type             = "gp3"
    encrypted        = true
  
    tags = {
      Name        = "${var.project_name}-postgres-data"
      Environment = var.environment
    }
  }
  
  resource "aws_volume_attachment" "postgres_data" {
    device_name = "/dev/sdf"
    volume_id   = aws_ebs_volume.postgres_data.id
    instance_id = aws_instance.app.id
  }
  

  # EBS volume for MinIO
  resource "aws_ebs_volume" "minio_data" {
    availability_zone = aws_instance.app.availability_zone
    size             = 50  # Size in GB
    type             = "gp3"
    encrypted        = true
  
    tags = {
      Name        = "${var.project_name}-minio-data"
      Environment = var.environment
    }
  }
  
  resource "aws_volume_attachment" "minio_data" {
    device_name = "/dev/sdg"
    volume_id   = aws_ebs_volume.minio_data.id
    instance_id = aws_instance.app.id
  }