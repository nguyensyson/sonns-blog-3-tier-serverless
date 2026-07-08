variable "project_name" {
  description = "Project name prefix used by every environment's resource names (e.g. IAM roles are named \"<project_name>-<environment>-...\"). Scopes this role's IAM permissions to \"<project_name>-*\" only."
  type        = string
}

variable "github_repository" {
  description = "GitHub repo allowed to assume this role, as \"owner/repo\" (e.g. \"nguyensyson/sonns-blog-3-tier-serverless\")."
  type        = string
}

variable "allowed_subjects" {
  description = "OIDC subject patterns (token.actions.githubusercontent.com:sub) allowed to assume this role. Defaults to only the main branch of github_repository - workflow_dispatch runs also present this subject when triggered on main."
  type        = list(string)
  default     = null
}

variable "role_name" {
  description = "Name of the IAM role GitHub Actions assumes."
  type        = string
  default     = "github-actions-deploy"
}

variable "tags" {
  type    = map(string)
  default = {}
}
