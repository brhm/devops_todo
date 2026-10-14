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