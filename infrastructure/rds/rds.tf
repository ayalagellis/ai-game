################################
# RANDOM PASSWORD (DB PASSWORD)
################################
resource "random_password" "db_password" {
  length  = 32
  special = true
}

################################
# STORE PASSWORD IN SSM
################################
resource "aws_ssm_parameter" "db_password" {
  name  = "/ai-game/db/password"
  type  = "SecureString"
  value = random_password.db_password.result
}

################################
# STORE DATABASE URL IN SSM
################################

resource "aws_ssm_parameter" "db_url" {
  name      = "/ai-game/database-url"
  type      = "SecureString"
  value     = "postgresql://${aws_db_instance.postgres.username}:${urlencode(random_password.db_password.result)}@${aws_db_instance.postgres.address}:5432/ai_game"
  overwrite = true
}


################################
# SECURITY GROUP FOR RDS
################################
resource "aws_security_group" "rds_sg" {
  name        = "rds-sg"
  description = "Allow ECS Fargate to access RDS"
  vpc_id      = data.terraform_remote_state.vpc.outputs.vpc_id

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = ["sg-02bee8737d6054c47"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "rds-sg"
  }
}

################################
# SUBNET GROUP (PRIVATE SUBNETS)
################################
resource "aws_db_subnet_group" "default" {
  name        = "ai-game-db-subnets"
  description = "Private subnets for RDS"
  subnet_ids  = data.terraform_remote_state.vpc.outputs.private_subnet_ids

  tags = {
    Name = "ai-game-db-subnets"
  }
}

################################
# POSTGRES RDS INSTANCE
################################
resource "aws_db_instance" "postgres" {
  identifier        = "ai-game-db"
  engine            = "postgres"
  engine_version    = "17.6"
  instance_class    = "db.t3.micro" # Free Tier
  allocated_storage = 20
  storage_type      = "gp2"

  db_name  = "ai_game"
  username = "postgres"
  password = random_password.db_password.result

  db_subnet_group_name   = aws_db_subnet_group.default.name
  vpc_security_group_ids = [aws_security_group.rds_sg.id]

  publicly_accessible = false
  skip_final_snapshot = true

  backup_retention_period = 1
  backup_window           = "03:00-04:00"
  maintenance_window      = "mon:04:00-mon:05:00"

  tags = {
    Name = "ai-game-postgres"
  }
}
