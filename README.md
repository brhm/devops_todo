# DevOps TODO — AWS EKS & Kubernetes

A full-stack TODO application used to demonstrate an end-to-end DevOps workflow on AWS: infrastructure as code, containerization, Kubernetes, CI/CD, autoscaling, monitoring, security, and load testing.

## Architecture

```text
Developer → GitHub → GitHub Actions → Docker Hub
                 │                       │
                 └── AWS OIDC → EKS ←────┘
                                  │
                      Frontend (React)
                                  │
                      Backend (Node.js)
                                  │
                           MongoDB + EBS

Terraform → AWS VPC / EKS / IAM / add-ons
Prometheus + Grafana + Loki → Metrics, dashboards and logs
HPA + Cluster Autoscaler → Pod and node scaling
```

## Technology Stack

| Area | Technologies |
|---|---|
| Application | React, Node.js, Express, MongoDB |
| Containers | Docker, Docker Compose, Docker Hub |
| Infrastructure | AWS VPC, EKS, IAM, EBS, S3, Terraform |
| Kubernetes | kubectl, Helm, Deployments, Services, PVC, HPA |
| Automation | GitHub Actions, AWS OIDC, Kubernetes RBAC |
| Observability | Prometheus, Grafana, Loki |
| Testing | k6, health and connectivity checks |
| Security | IAM, RBAC, VPC CNI NetworkPolicy |

## 1. Local Prerequisites

The project was developed from **Windows PowerShell**. Install:

- Git and a code editor
- Node.js and npm
- Docker Desktop with Docker Compose
- AWS CLI v2
- Terraform
- kubectl
- Helm
- k6 (for load tests)

Check your installation:

```powershell
git --version
node --version
npm --version
docker --version
docker compose version
aws --version
terraform version
kubectl version --client
helm version
k6 version
```

Configure AWS authentication using an authorized profile or IAM Identity Center (SSO). For a basic local profile, `aws configure` is also available.

```powershell
aws sts get-caller-identity
aws configure list
```

**Do not commit credentials, `.env` secrets, Terraform state files, or kubeconfig files.**

## 2. Application Development & Docker

- Built a React frontend, a Node.js/Express API, and MongoDB persistence.
- Added container configurations for frontend and backend.
- Used Docker Compose for local development and integration checks.
- Published application images to Docker Hub.

Example local workflow (from the repository root, where the Compose file is located):

```powershell
docker compose up -d --build
docker compose ps
docker compose down
```

Docker Hub image repositories:

- `brhmkskn/devops-todo-frontend`
- `brhmkskn/devops-todo-backend`

## 3. AWS Infrastructure with Terraform

Terraform provisions and manages the core AWS infrastructure:

- VPC networking, subnets and routing
- Amazon EKS cluster and managed node group
- IAM roles and permissions
- EKS add-ons (VPC CNI, CoreDNS, kube-proxy, EBS CSI Driver, Pod Identity Agent)
- Storage and supporting resources
- Autoscaler-related infrastructure and permissions
- S3 remote state backend

The reference environment uses **`eu-central-1`** and EKS cluster **`devops-todo-eks`**.

```powershell
cd terraform
terraform init
terraform fmt -check
terraform validate
terraform plan
# Review the plan before applying changes:
terraform apply
cd ..
```

**Important:** The S3 backend must be configured and accessible before `terraform init`. Backend names, account IDs, role ARNs and other environment-specific values must be reviewed before reuse. Running `terraform apply` creates or modifies billable AWS resources.

## 4. Connect kubectl to Amazon EKS

After the cluster exists, update the local kubeconfig:

```powershell
aws eks update-kubeconfig --region eu-central-1 --name devops-todo-eks
kubectl config current-context
kubectl get nodes
kubectl get pods -A
```

The AWS identity used here needs the appropriate EKS access permissions.

## 5. Kubernetes Application Deployment

The application runs in the **`devops-todo`** namespace:

- Frontend and backend Deployments and Services
- MongoDB Deployment and Service
- PersistentVolumeClaim backed by AWS EBS
- Health probes and resource settings
- Horizontal Pod Autoscaler for application pods

The Kubernetes manifests are maintained in the repository. Apply them in dependency order: namespace and storage first, then database, backend, frontend and scaling resources. **Use the actual manifest paths from this repository**, rather than assuming generic filenames.

Useful checks:

```powershell
kubectl get deployments,pods,services -n devops-todo
kubectl get pvc -n devops-todo
kubectl get hpa -n devops-todo
kubectl logs deployment/backend -n devops-todo
```

## 6. CI/CD with GitHub Actions

GitHub Actions workflows automate the development and delivery process:

1. Validate changes and run checks.
2. Build container images.
3. Publish images to Docker Hub.
4. Authenticate to AWS through **GitHub OIDC**.
5. Deploy or update application workloads on EKS.
6. Run additional validation and k6 load tests where configured.

AWS IAM roles and Kubernetes RBAC control what the workflows may access. OIDC avoids storing long-lived AWS access keys as GitHub secrets.

Workflows are defined under `.github/workflows/`; consult the repository for exact workflow names and triggers.

## 7. Autoscaling

Two scaling layers were configured:

- **Horizontal Pod Autoscaler (HPA):** Changes application replica counts based on configured metrics.
- **Cluster Autoscaler:** Adjusts the EKS managed node group capacity when pods require more or fewer nodes.

Cluster Autoscaler is managed using Terraform/Helm and AWS Pod Identity.

```powershell
kubectl get hpa -n devops-todo
kubectl get nodes
kubectl get deployment cluster-autoscaler -n kube-system
```

## 8. Monitoring & Logging

The monitoring stack runs in the **`monitoring`** namespace:

- **Prometheus:** Metrics collection
- **Grafana:** Dashboards and visualization
- **Loki:** Centralized logs
- **kube-state-metrics and node-exporter:** Kubernetes and node metrics

Helm is used for chart-based components. Typical Helm repository setup:

```powershell
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo add grafana https://grafana.github.io/helm-charts
helm repo update
helm list -n monitoring
kubectl get pods -n monitoring
```

Chart versions and custom values should be taken from the repository's actual configuration; generic `helm install` examples are not a replacement for the project's managed deployment.

## 9. Security & Access Control

- Applied least-privilege-oriented AWS IAM and Kubernetes RBAC configurations.
- Used OIDC for GitHub Actions AWS access.
- Enabled Kubernetes NetworkPolicy support in the AWS VPC CNI add-on.
- Restricted **MongoDB ingress** to authorized backend pods.
- Tested that an unauthorized pod could not connect to MongoDB, while the backend remained functional.

```powershell
kubectl get networkpolicy -n devops-todo
kubectl describe networkpolicy -n devops-todo
```

The MongoDB NetworkPolicy is managed through Terraform, so avoid creating a second competing policy manually.

## 10. Load Testing & Validation

k6 was used to exercise the application backend and validate the load-test workflow.

Checks performed during the project included:

- Terraform validation and plan review
- EKS node and Kubernetes pod readiness
- Backend health endpoint and MongoDB connectivity
- Storage and service checks
- GitHub Actions workflow execution
- HPA/Cluster Autoscaler configuration checks
- Monitoring stack health
- Authorized versus unauthorized MongoDB network access
- k6 load-test execution

Example final cluster checks:

```powershell
kubectl get pods -n devops-todo
kubectl get pods -n monitoring
kubectl get nodes
```

At the final check, the application and monitoring pods were reported as **Running**.

## 11. Scope & Limitations

This is a **portfolio/lab project**, not a production-ready reference architecture.

- The AWS backend and infrastructure configuration contain environment-specific settings.
- A fully automated, one-command bootstrap from a new AWS account is **not included**.
- A new environment requires preparation of AWS access, Terraform state, permissions and deployment configuration.
- Production hardening (for example, database credentials, backups, disaster recovery, alerting and durable monitoring storage) requires further review.
- AWS EKS, compute, storage and networking may incur costs while resources are running.

**Before deleting the environment:** review Terraform state, persistent data, EBS volumes and any resources created outside Terraform. Do not assume `terraform destroy` covers everything.
