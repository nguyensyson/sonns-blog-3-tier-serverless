variable "aws_region" {
  description = "Primary AWS region for regional resources (Lambda, API Gateway, DynamoDB, S3, Secrets Manager)."
  type        = string
  default     = "ap-southeast-1"
}

variable "project_name" {
  description = "Project name used in resource names and tags."
  type        = string
}

variable "environment" {
  description = "Environment name (dev/prod)."
  type        = string
  default     = "prod"
}

variable "owner" {
  description = "Team or person responsible for this environment's resources."
  type        = string
}

variable "cost_center" {
  description = "Optional cost center tag for chargeback/cost tracking."
  type        = string
  default     = ""
}

# --- DNS / TLS ---

variable "root_domain_name" {
  description = "Route 53 hosted zone name, e.g. \"example.com\"."
  type        = string
}

variable "site_domain_name" {
  description = "Full domain name clients use to reach this environment, e.g. \"example.com\" or \"www.example.com\"."
  type        = string
}

variable "create_route53_zone" {
  description = "Whether this environment call creates the hosted zone. If dev and prod share the same root_domain_name, set this true in only ONE environment and false in the other(s). Defaults false here because environments/dev defaults it to true - flip as needed."
  type        = bool
  default     = false
}

# --- Lambda ---
# Backend is 3 independent Python/FastAPI functions sharing one Lambda Layer
# (see backend/README.md). Each *_source_dir points at the module's own
# directory - only that directory's contents get zipped for that function.

variable "lambda_user_source_dir" {
  description = "Path to the User Lambda function source directory (backend/modules/user)."
  type        = string
}

variable "lambda_posts_source_dir" {
  description = "Path to the Posts Lambda function source directory (backend/modules/posts)."
  type        = string
}

variable "lambda_tasks_source_dir" {
  description = "Path to the Tasks Lambda function source directory (backend/modules/tasks)."
  type        = string
}

variable "lambda_layer_source_dir" {
  description = "Path to the shared Lambda Layer directory (backend/layers/common) - must already contain a populated python/ folder (`pip install -r requirements.txt -t python/`). Ignored if lambda_layer_zip_path is set."
  type        = string
  default     = null
}

variable "lambda_layer_zip_path" {
  description = "Path to a pre-built common-layer.zip (e.g. produced by CI/CD). Takes precedence over lambda_layer_source_dir."
  type        = string
  default     = null
}

variable "lambda_runtime" {
  description = "Lambda runtime identifier."
  type        = string
  default     = "python3.12"
}

variable "lambda_handler" {
  description = "Lambda function handler, shared by all 3 modules (each module's main.py exposes `handler = Mangum(app)`)."
  type        = string
  default     = "main.handler"
}

variable "lambda_memory_size" {
  description = "Lambda memory (MB)."
  type        = number
  default     = 256
}

variable "lambda_timeout" {
  description = "Lambda timeout (seconds)."
  type        = number
  default     = 15
}

variable "cors_allow_origins" {
  description = "Comma-separated list of allowed CORS origins passed to every function as CORS_ALLOW_ORIGINS (e.g. \"https://example.com\")."
  type        = string
  default     = "*"
}

# --- DynamoDB ---
# Table hash/range keys and GSIs are fixed by the application code (see
# backend/shared/dynamodb-schema.md), not user-configurable - only the
# billing mode varies per environment.

variable "dynamodb_billing_mode" {
  description = "PAY_PER_REQUEST or PROVISIONED."
  type        = string
  default     = "PAY_PER_REQUEST"
}

# --- Secrets Manager ---

variable "secret_description" {
  description = "Description for the application secret (holds the JWT signing secret read by all 3 Lambda functions)."
  type        = string
  default     = "JWT signing secret and other API keys/credentials for the Lambda backend."
}

# --- CloudWatch ---

variable "log_retention_days" {
  description = "CloudWatch log retention (days). Longer in prod for audit/debugging history."
  type        = number
  default     = 90
}

variable "alarm_email" {
  description = "Optional email address subscribed to CloudWatch alarm notifications."
  type        = string
  default     = ""
}

variable "manage_apigateway_account_settings" {
  description = "Whether this environment manages the account-wide API Gateway CloudWatch logging role. See modules/iam for details on this singleton setting."
  type        = bool
  default     = false
}
