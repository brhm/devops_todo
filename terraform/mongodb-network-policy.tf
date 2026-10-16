resource "kubernetes_network_policy_v1" "mongodb" {
  metadata {
    name      = "mongodb-ingress"
    namespace = "devops-todo"
  }

  spec {
    pod_selector {
      match_labels = {
        app = "mongodb"
      }
    }

    policy_types = ["Ingress"]

    ingress {
      from {
        pod_selector {
          match_labels = {
            app = "backend"
          }
        }
      }

      ports {
        protocol = "TCP"
        port     = "27017"
      }
    }
  }
}