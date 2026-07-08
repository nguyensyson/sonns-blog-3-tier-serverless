output "state_bucket_name" {
  description = "S3 bucket name to use as `bucket` in each environment's backend.tf."
  value       = aws_s3_bucket.terraform_state.id
}

output "state_bucket_arn" {
  description = "ARN of the Terraform state bucket."
  value       = aws_s3_bucket.terraform_state.arn
}

output "lock_table_name" {
  description = "DynamoDB table name to use as `dynamodb_table` in each environment's backend.tf."
  value       = aws_dynamodb_table.terraform_locks.name
}

output "aws_region" {
  description = "AWS region to use as `region` in each environment's backend.tf."
  value       = var.aws_region
}

output "github_actions_role_arn" {
  description = "ARN of the OIDC-federated IAM role GitHub Actions assumes. Set this as the AWS_GITHUB_ACTIONS_ROLE_ARN repository variable."
  value       = module.github_actions_oidc.role_arn
}
