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
    volume_size = 30
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

              # Create test marker to force instance replacement - $(date +%s)
              echo "Instance created on $(date)" > /root/.instance_created_at

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

              # Install Docker and Docker Compose
              curl -fsSL https://get.docker.com -o get-docker.sh
              sh get-docker.sh
              curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
              chmod +x /usr/local/bin/docker-compose
              usermod -aG docker ubuntu

              # Create mount points
              mkdir -p /mnt/traefik
              mkdir -p /mnt/postgres
              mkdir -p /mnt/minio

              # Wait for EBS volumes to be available
              sleep 10

              # Format EBS volumes if needed (we need to wait for attachments)
              if [ -e ${var.cert_device_name} ] && [ "$(blkid ${var.cert_device_name} | wc -l)" -eq 0 ]; then
                mkfs -t ext4 ${var.cert_device_name}
              fi

              if [ -e ${var.postgres_device_name} ] && [ "$(blkid ${var.postgres_device_name} | wc -l)" -eq 0 ]; then
                mkfs -t ext4 ${var.postgres_device_name}
              fi

              if [ -e ${var.minio_device_name} ] && [ "$(blkid ${var.minio_device_name} | wc -l)" -eq 0 ]; then
                mkfs -t ext4 ${var.minio_device_name}
              fi

              # Setup mount points in fstab
              echo "${var.cert_device_name} /mnt/traefik ext4 defaults,nofail 0 2" >> /etc/fstab
              echo "${var.postgres_device_name} /mnt/postgres ext4 defaults,nofail 0 2" >> /etc/fstab
              echo "${var.minio_device_name} /mnt/minio ext4 defaults,nofail 0 2" >> /etc/fstab

              # Mount all filesystems
              mount -a || true

              # Set proper permissions
              chown -R 1000:1000 /mnt/traefik
              chmod -R 700 /mnt/traefik
              chown -R 999:999 /mnt/postgres
              chmod -R 700 /mnt/postgres
              chown -R 1000:1000 /mnt/minio
              chmod -R 700 /mnt/minio

              # Install monitoring tools
              apt-get install -y htop iotop net-tools tcpdump nmap
              # Install host command needed for DNS checks
              apt-get install -y dnsutils
              
              EOF

  tags = {
    Name        = "${var.project_name}-instance"
    Environment = var.environment
  }
}