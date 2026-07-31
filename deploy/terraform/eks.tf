module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "19.16.0"

  cluster_name    = var.cluster_name
  cluster_version = "1.28"
  
  vpc_id                         = module.vpc.vpc_id
  subnet_ids                     = module.vpc.private_subnets
  cluster_endpoint_public_access = true

  eks_managed_node_groups = {
    spot_group = {
      desired_size = 2
      min_size     = 1
      max_size     = 5

      instance_types = ["t3.medium", "t3.large"]
      capacity_type  = "SPOT"

      tags = {
        Environment = "Production"
      }
    }
  }

  # Add ALB ingress controller IRSA mapping if needed
}
