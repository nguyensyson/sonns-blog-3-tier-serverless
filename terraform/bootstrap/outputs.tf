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
