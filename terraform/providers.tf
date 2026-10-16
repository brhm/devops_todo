provider "aws" {
  region = "eu-central-1"

  default_tags {
    tags = {
      Project     = "devops-todo"
      Environment = "dev"
      ManagedBy   = "Terraform"
    }
  }
}
data "aws_eks_cluster" "current" {
  name = "devops-todo-eks"
}

data "aws_eks_cluster_auth" "current" {
  name = data.aws_eks_cluster.current.name
}

provider "helm" {
  kubernetes = {
    host                   = data.aws_eks_cluster.current.endpoint
    cluster_ca_certificate = base64decode(data.aws_eks_cluster.current.certificate_authority[0].data)
    token                  = data.aws_eks_cluster_auth.current.token
  }
}