variable "aws_region" {
  description = "AWS region where the state bucket and lock table are created."
  type        = string
  default     = "ap-southeast-1"
}

variable "project_name" {
  description = "Project name, used to build resource names and tags."
  type        = string
}

variable "state_bucket_name" {
  description = "Globally-unique name for the S3 bucket that stores Terraform state."
  type        = string
}

variable "lock_table_name" {
  description = "Name of the DynamoDB table used for Terraform state locking."
  type        = string
  default     = "terraform-locks"
}

variable "tags" {
  description = "Common tags applied to bootstrap resources."
  type        = map(string)
  default     = {}
}

variable "github_repository" {
  description = "GitHub repo allowed to assume the CI/CD deploy role via OIDC, as \"owner/repo\" (e.g. \"nguyensyson/sonns-blog-3-tier-serverless\")."
  type        = string
}
