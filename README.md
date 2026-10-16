# DevOps TODO — AWS EKS & Kubernetes

A full-stack TODO application demonstrating an end-to-end DevOps workflow on AWS: infrastructure as code, containerization, Kubernetes, CI/CD, autoscaling, monitoring, security, load testing, and public application access through an AWS Application Load Balancer (ALB).

## Architecture

```text
Developer → GitHub → GitHub Actions → Docker Hub
                 │                       │
                 └── AWS OIDC → Amazon EKS ←┘
                                      │
Internet → Public AWS ALB → Kubernetes Ingress (ALB)
                                      │
                           Frontend (React + Nginx)
                                      │ /api (internal proxy)
                           Backend (Node.js + Express)
                                      │
                                MongoDB + EBS

Terraform → VPC / EKS / IAM / EKS Pod Identity / Helm / add-ons
Prometheus + Grafana + Loki → Metrics, dashboards and logs
HPA + Cluster Autoscaler → Pod and node scaling
AWS Load Balancer Controller → Public ALB and target groups
```

The ALB forwards HTTP traffic to the frontend Kubernetes Service. Nginx serves the React application and proxies `/api` requests to the internal backend Service (`http://backend:3000`). MongoDB is not publicly exposed.

## Technology Stack

| Area | Technologies |
|---|---|
| Application | React, Nginx, Node.js, Express, MongoDB |
| Containers | Docker, Docker Compose, Docker Hub |
| Infrastructure | AWS VPC, EKS, IAM, EBS, S3, Terraform, ALB |
| Kubernetes | kubectl, Helm, Deployments, Services, Ingress, PVC, HPA |
| Automation | GitHub Actions, AWS OIDC, Kubernetes RBAC |
| Observability | Prometheus, Grafana, Loki |
| Testing | k6, HTTP/API and connectivity checks |
| Security | IAM, EKS Pod Identity, RBAC, VPC CNI NetworkPolicy |

## 1. Local Prerequisites

The project was developed from **Windows PowerShell**. Install Git, Node.js/npm, Docker Desktop/Compose, AWS CLI v2, Terraform, kubectl, Helm and k6.

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

Configure authorized AWS access and verify it:

```powershell
aws sts get-caller-identity
aws configure list
```

**Never commit credentials, `.env` secrets, Terraform state, Terraform plan files, or kubeconfig files.**

## 2. Application Development & Docker

- React frontend with Nginx, Node.js/Express API, and MongoDB persistence.
- Dockerfiles and Docker Compose for local development and integration checks.
- Images published to Docker Hub: `brhmkskn/devops-todo-frontend` and `brhmkskn/devops-todo-backend`.

```powershell
docker compose up -d --build
docker compose ps
docker compose down
```

## 3. AWS Infrastructure with Terraform

Terraform provisions the VPC, public/private subnets, routing, Amazon EKS managed node groups, IAM roles and policies, EKS add-ons (VPC CNI, CoreDNS, kube-proxy, EBS CSI Driver, Pod Identity Agent), supporting storage resources, Cluster Autoscaler, and AWS Load Balancer Controller dependencies.

Reference region: **`eu-central-1`**. EKS cluster: **`devops-todo-eks`**. Terraform uses an S3 remote state backend, which must be prepared separately.

```powershell
cd terraform
terraform init
terraform fmt -check
terraform validate
terraform plan
# Review all changes before applying:
terraform apply
cd ..
```

Terraform configuration contains environment-specific identifiers and settings. AWS infrastructure incurs charges while running. Review the full plan before applying changes.

## 4. Connect kubectl to Amazon EKS

```powershell
aws eks update-kubeconfig --region eu-central-1 --name devops-todo-eks
kubectl config current-context
kubectl get nodes
kubectl get pods -A
```

The AWS identity must have appropriate EKS access permissions.

## 5. Kubernetes Application Deployment

The application runs in namespace **`devops-todo`** with frontend, backend and MongoDB Deployments/Services, an EBS-backed MongoDB PersistentVolumeClaim, health probes, resource settings and HPA.

Apply manifests from the repository's `kubernetes/` directory in dependency order (namespace/storage, database, backend, frontend, scaling). Consult the actual filenames before deploying.

```powershell
kubectl get deployments,pods,services -n devops-todo
kubectl get pvc -n devops-todo
kubectl get hpa -n devops-todo
kubectl logs deployment/backend -n devops-todo
```

## 6. CI/CD with GitHub Actions

GitHub Actions validates changes, builds and pushes container images to Docker Hub, authenticates to AWS through **GitHub OIDC**, and deploys/updates workloads on EKS. Additional validation and k6 load tests run where configured.

AWS IAM and Kubernetes RBAC constrain workflow permissions. OIDC avoids storing long-lived AWS access keys in GitHub secrets. See `.github/workflows/` for the actual triggers and workflow files.

## 7. Autoscaling

- **Horizontal Pod Autoscaler (HPA):** Adjusts application replica counts based on configured metrics.
- **Cluster Autoscaler:** Adjusts managed node group capacity as needed.

Cluster Autoscaler is managed using Terraform, Helm and EKS Pod Identity.

```powershell
kubectl get hpa -n devops-todo
kubectl get nodes
kubectl get deployment cluster-autoscaler -n kube-system
```

## 8. Monitoring & Logging

The `monitoring` namespace contains **Prometheus**, **Grafana**, **Loki**, and Kubernetes/node metrics exporters. Helm manages the monitoring releases.

```powershell
helm list -n monitoring
kubectl get pods -n monitoring
```

## 9. Security & Access Control

- IAM and Kubernetes RBAC limit infrastructure and cluster access.
- GitHub Actions uses AWS OIDC; controllers use EKS Pod Identity.
- AWS VPC CNI NetworkPolicy restricts MongoDB ingress to authorized backend pods.
- Unauthorized MongoDB access was tested and blocked while backend access remained functional.
- Frontend and backend Kubernetes Services remain `ClusterIP`; MongoDB is not exposed publicly.

```powershell
kubectl get networkpolicy -n devops-todo
kubectl describe networkpolicy -n devops-todo
```

The MongoDB NetworkPolicy is managed by Terraform; do not add competing policies manually.

## 10. Public Access with AWS Application Load Balancer

The public endpoint is provisioned by the **AWS Load Balancer Controller**, installed through Terraform-managed Helm with a dedicated IAM role, IAM policy, and **EKS Pod Identity Association**.

Relevant files:

```text
terraform/aws-load-balancer-controller.tf
terraform/aws-load-balancer-controller-helm.tf
terraform/aws-load-balancer-controller-iam-policy.json
kubernetes/ingress.yaml
frontend/nginx.conf
```

The Ingress uses `ingressClassName: alb`, `internet-facing` scheme, `ip` target type, and an HTTP listener on port 80. Two tagged public subnets in separate availability zones support the ALB. The ALB forwards `/` to the frontend Service on port 80; Nginx proxies `/api` internally to `backend:3000`.

```powershell
# The controller must already be installed and ready:
kubectl get deployment aws-load-balancer-controller -n kube-system

# Create/update the ALB-backed Ingress:
kubectl apply -f .\kubernetes\ingress.yaml

# Get the public ALB DNS name:
kubectl get ingress devops-todo-public -n devops-todo

# Inspect ingress events if the ADDRESS remains empty:
kubectl describe ingress devops-todo-public -n devops-todo
```

The public URL is **HTTP only** in this lab. The ALB DNS name is environment-specific and may change after recreation; obtain the current address from `kubectl get ingress` rather than hardcoding it.

Example verification using the current Ingress address:

```powershell
$alb = kubectl get ingress devops-todo-public -n devops-todo -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'
curl.exe -i "http://$alb/"
curl.exe -i "http://$alb/api"
```

**Observed results (October 2026):** `HTTP/1.1 200 OK` from the frontend and API. The API returned stored TODO records from MongoDB. Browser access to the frontend was also confirmed. Browser-based create/delete operations should be tested separately; they were not yet confirmed in the documented session.

**Production considerations:** Add HTTPS with an ACM certificate and custom domain, redirect HTTP to HTTPS, restrict access as appropriate, and review security groups, WAF, observability and application secrets. The current setup is a portfolio/lab demonstration, not a production-ready public service.

## 11. Load Testing & Validation

k6 was used to exercise the backend and validate the load-test workflow. Other checks included Terraform validation, node/pod readiness, MongoDB connectivity, EBS persistence, GitHub Actions runs, autoscaling, monitoring, and NetworkPolicy access restrictions.

```powershell
kubectl get pods -n devops-todo
kubectl get pods -n monitoring
kubectl get nodes
kubectl get ingress -n devops-todo
```

## 12. Scope, Costs & Cleanup

This is a **portfolio/lab project**, not a production-ready reference architecture or one-command bootstrap for a new AWS account. It requires environment-specific AWS access, state backend, permissions and deployment settings. Production hardening (secrets, HTTPS, backups, disaster recovery, alerting and durable monitoring storage) needs further work.

**AWS resources may incur ongoing costs**, including EKS, EC2, NAT Gateway, EBS, and ALB. The ALB is created by the Kubernetes Ingress and is **not itself a standalone Terraform resource**.

For cleanup, review persistent data first; then remove the Kubernetes Ingress to trigger ALB/target-group deletion, uninstall separately managed monitoring Helm releases, remove application workloads and PVCs, and only then run a reviewed `terraform destroy`. Verify that ALBs, target groups, EBS volumes, NAT gateways and other project resources have actually disappeared. **Do not delete unrelated AWS resources.**
