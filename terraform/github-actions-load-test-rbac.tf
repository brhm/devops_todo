resource "kubernetes_role_v1" "github_actions_load_test" {
  metadata {
    name      = "github-actions-load-test"
    namespace = "devops-todo"
  }

  rule {
    api_groups = [""]
    resources  = ["pods/portforward"]
    verbs      = ["create"]
  }
}

resource "kubernetes_role_binding_v1" "github_actions_load_test" {
  metadata {
    name      = "github-actions-load-test-binding"
    namespace = "devops-todo"
  }

  role_ref {
    api_group = "rbac.authorization.k8s.io"
    kind      = "Role"
    name      = kubernetes_role_v1.github_actions_load_test.metadata[0].name
  }

  subject {
    kind      = "Group"
    name      = "devops-todo-deployers"
    api_group = "rbac.authorization.k8s.io"
  }
}
