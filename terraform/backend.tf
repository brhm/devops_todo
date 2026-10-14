terraform {
  backend "s3" {
    bucket       = "devops-todo-tfstate-344730535071"
    key          = "devops-todo/terraform.tfstate"
    region       = "eu-central-1"
    encrypt      = true
    use_lockfile = true
  }
}