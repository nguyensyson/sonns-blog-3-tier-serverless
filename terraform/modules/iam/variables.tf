variable "name_prefix" {
  description = "Prefix used to name the IAM role and policies (e.g. \"blog-spa-dev\")."
  type        = string
}

variable "dynamodb_table_arns" {
  description = "ARNs of DynamoDB tables the Lambda role may read/write. Include index ARNs (arn/index/*) if the function queries a GSI."
  type        = list(string)
}

variable "s3_images_bucket_arn" {
  description = "ARN of the S3 images bucket. The role is granted GetObject/PutObject on objects under this bucket only."
  type        = string
}

variable "secrets_manager_secret_arns" {
  description = "ARNs of Secrets Manager secrets the Lambda role may read."
  type        = list(string)
  default     = []
}

variable "manage_apigateway_account_settings" {
  description = <<-EOT
    Whether this module manages the account/region-wide API Gateway CloudWatch
    logging role (aws_api_gateway_account). This setting is a SINGLETON per
    AWS account + region - if dev and prod share an account, set this to true
    in exactly ONE environment (recommended: the first one you deploy) and
    false in the others, otherwise their applies will fight over it.
  EOT
  type        = bool
  default     = false
}

variable "tags" {
  description = "Tags applied to the IAM role."
  type        = map(string)
  default     = {}
}
