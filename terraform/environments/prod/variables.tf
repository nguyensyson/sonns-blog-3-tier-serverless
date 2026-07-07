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

variable "lambda_source_dir" {
  description = "Path to the backend Lambda source directory to zip and deploy."
  type        = string
}

variable "lambda_runtime" {
  description = "Lambda runtime identifier."
  type        = string
  default     = "nodejs20.x"
}

variable "lambda_handler" {
  description = "Lambda function handler."
  type        = string
  default     = "index.handler"
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

# --- DynamoDB ---

variable "dynamodb_billing_mode" {
  description = "PAY_PER_REQUEST or PROVISIONED."
  type        = string
  default     = "PAY_PER_REQUEST"
}

variable "dynamodb_hash_key" {
  description = "Partition key name for the main application table."
  type        = string
  default     = "id"
}

# --- Secrets Manager ---

variable "secret_description" {
  description = "Description for the application secret."
  type        = string
  default     = "Application API keys/credentials for the Lambda backend."
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
