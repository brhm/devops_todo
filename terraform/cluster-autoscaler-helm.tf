resource "helm_release" "cluster_autoscaler" {
  name       = "cluster-autoscaler"
  repository = "https://kubernetes.github.io/autoscaler"
  chart      = "cluster-autoscaler"
  version    = "9.53.0"
  namespace  = "kube-system"

  values = [
    file("${path.module}/cluster-autoscaler-values.yaml")
  ]

  depends_on = [
    aws_eks_pod_identity_association.cluster_autoscaler
  ]
}