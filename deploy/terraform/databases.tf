# DocumentDB (MongoDB compatible)
resource "aws_docdb_cluster" "mongo" {
  cluster_identifier      = "careerpilot-docdb"
  engine                  = "docdb"
  master_username         = "adminuser"
  master_password         = "ChangeThisSecurePassword123" # In production, use AWS Secrets Manager
  backup_retention_period = 5
  preferred_backup_window = "07:00-09:00"
  skip_final_snapshot     = true
  vpc_security_group_ids  = [aws_security_group.db_sg.id]
  db_subnet_group_name    = aws_docdb_subnet_group.docdb_subnet.name
}

resource "aws_docdb_subnet_group" "docdb_subnet" {
  name       = "docdb-subnet-group"
  subnet_ids = module.vpc.private_subnets
}

resource "aws_docdb_cluster_instance" "cluster_instances" {
  count              = 1
  identifier         = "docdb-cluster-demo-${count.index}"
  cluster_identifier = aws_docdb_cluster.mongo.id
  instance_class     = "db.t3.medium"
}

# ElastiCache (Redis)
resource "aws_elasticache_cluster" "redis" {
  cluster_id           = "careerpilot-redis"
  engine               = "redis"
  node_type            = "cache.t3.micro"
  num_cache_nodes      = 1
  parameter_group_name = "default.redis7"
  engine_version       = "7.0"
  port                 = 6379
  security_group_ids   = [aws_security_group.db_sg.id]
  subnet_group_name    = aws_elasticache_subnet_group.redis_subnet.name
}

resource "aws_elasticache_subnet_group" "redis_subnet" {
  name       = "redis-subnet-group"
  subnet_ids = module.vpc.private_subnets
}

# Security group for internal DB access
resource "aws_security_group" "db_sg" {
  name        = "careerpilot-db-sg"
  description = "Allow inbound traffic from EKS"
  vpc_id      = module.vpc.vpc_id

  ingress {
    description = "Allow from VPC"
    from_port   = 0
    to_port     = 65535
    protocol    = "tcp"
    cidr_blocks = [module.vpc.vpc_cidr_block]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}
