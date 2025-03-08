# terraform/modules/ebs/main.tf
resource "aws_ebs_volume" "cert_volume" {
  availability_zone = var.availability_zone
  size              = 1  # 1GB for certificates
  type              = "gp3"
  encrypted         = true
  
  tags = {
    Name        = "${var.project_name}-cert-volume"
    Environment = var.environment
  }
}

resource "aws_ebs_volume" "postgres_volume" {
  availability_zone = var.availability_zone
  size              = 20  # 20GB for PostgreSQL data
  type              = "gp3"
  encrypted         = true
  
  tags = {
    Name        = "${var.project_name}-postgres-volume"
    Environment = var.environment
  }
}

resource "aws_ebs_volume" "minio_volume" {
  availability_zone = var.availability_zone
  size              = 20  # 20GB for MinIO data
  type              = "gp3"
  encrypted         = true
  
  tags = {
    Name        = "${var.project_name}-minio-volume"
    Environment = var.environment
  }
}
