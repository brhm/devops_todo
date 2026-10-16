module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 6.0"

  name = "devops-todo-vpc"
  cidr = "10.20.0.0/16"

  azs = [
    "eu-central-1a",
    "eu-central-1b"
  ]

  public_subnets = [
    "10.20.0.0/24",
    "10.20.1.0/24"
  ]

  private_subnets = [
    "10.20.10.0/24",
    "10.20.11.0/24"
  ]

  enable_nat_gateway = false

  map_public_ip_on_launch = true

  enable_dns_hostnames = true
  enable_dns_support   = true

  public_subnet_tags = {
    "kubernetes.io/role/elb" = "1"
  }

  private_subnet_tags = {
    "kubernetes.io/role/internal-elb" = "1"
  }
}
module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "~> 21.0"

  name               = "devops-todo-eks"
  kubernetes_version = "1.34"

  endpoint_public_access = true

  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.public_subnets

  enable_cluster_creator_admin_permissions = true


  addons = {
    vpc-cni = {
        before_compute = true

        configuration_values = jsonencode({
            enableNetworkPolicy = "true"
        })
    }
    kube-proxy = {}

    coredns = {}

    eks-pod-identity-agent = {}

    aws-ebs-csi-driver = {
      pod_identity_association = [
        {
          role_arn        = aws_iam_role.ebs_csi.arn
          service_account = "ebs-csi-controller-sa"
        }
      ]
    }
  }

  eks_managed_node_groups = {
    devops_nodes = {
      instance_types = ["t3.medium"]

      min_size     = 1
      max_size     = 2
      desired_size = 1

      subnet_ids = module.vpc.public_subnets

      create_launch_template     = false
      use_custom_launch_template = false
    }
  }

  tags = {
    Project     = "devops-todo"
    Environment = "dev"
  }
}