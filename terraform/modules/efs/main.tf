resource "aws_efs_file_system" "cert_storage" {
  creation_token = "${var.project_name}-${var.environment}-certs"
  encrypted      = true
  
  performance_mode = "generalPurpose"
  throughput_mode  = "bursting"
  
  lifecycle_policy {
    transition_to_ia = "AFTER_30_DAYS"
  }
  
  tags = {
    Name        = "${var.project_name}-cert-storage"
    Environment = var.environment
  }
}

resource "aws_efs_mount_target" "cert_mount" {
  file_system_id  = aws_efs_file_system.cert_storage.id
  subnet_id       = var.subnet_id
  security_groups = [aws_security_group.efs_sg.id]
}

resource "aws_security_group" "efs_sg" {
  name_prefix = "${var.project_name}-efs-sg"
  vpc_id      = var.vpc_id
  
  ingress {
    from_port       = 2049
    to_port         = 2049
    protocol        = "tcp"
    security_groups = [var.security_group_id]
    description     = "NFS from EC2"
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }
  
  tags = {
    Name        = "${var.project_name}-efs-sg"
    Environment = var.environment
  }
}

# Create a backup policy for EFS
resource "aws_efs_backup_policy" "cert_backup" {
  file_system_id = aws_efs_file_system.cert_storage.id
  
  backup_policy {
    status = "ENABLED"
  }
}

# Create access point for more granular access control
resource "aws_efs_access_point" "cert_access_point" {
  file_system_id = aws_efs_file_system.cert_storage.id
  
  posix_user {
    gid = 1000
    uid = 1000
  }
  
  root_directory {
    path = "/traefik"
    creation_info {
      owner_gid   = 1000
      owner_uid   = 1000
      permissions = "755"
    }
  }
  
  tags = {
    Name        = "${var.project_name}-cert-access-point"
    Environment = var.environment
  }
}
