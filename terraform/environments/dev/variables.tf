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
  default     = "dev"
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
  description = "Full domain name clients use to reach this environment, e.g. \"dev.example.com\"."
  type        = string
}

variable "create_route53_zone" {
  description = "Whether this environment call creates the hosted zone. If dev and prod share the same root_domain_name, set this true in only ONE environment and false in the other(s)."
  type        = bool
  default     = true
}

# --- Lambda ---
# The 3 Lambda functions + shared layer moved to SAM (see sam/template.yaml,
# sam/env/<stage>.toml) - there is nothing left to configure here. This
# environment only feeds SAM the resources below it still owns, via SSM
# parameters (see main.tf "SSM bridge" section).

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
# Log groups/alarms for the Lambda functions and API Gateway moved to SAM
# (see sam/template.yaml) - only the account-level API Gateway CloudWatch
# logging role setting is still configured here.

variable "manage_apigateway_account_settings" {
  description = "Whether this environment manages the account-wide API Gateway CloudWatch logging role. See modules/iam for details on this singleton setting."
  type        = bool
  default     = true
}
