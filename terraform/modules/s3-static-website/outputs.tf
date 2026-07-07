output "bucket_id" {
  description = "Name/ID of the frontend bucket."
  value       = aws_s3_bucket.this.id
}

output "bucket_arn" {
  description = "ARN of the frontend bucket."
  value       = aws_s3_bucket.this.arn
}

output "bucket_regional_domain_name" {
  description = "Regional domain name to use as the CloudFront S3 origin."
  value       = aws_s3_bucket.this.bucket_regional_domain_name
}
