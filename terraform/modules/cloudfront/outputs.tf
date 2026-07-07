output "distribution_id" {
  value = aws_cloudfront_distribution.this.id
}

output "distribution_arn" {
  value = aws_cloudfront_distribution.this.arn
}

output "domain_name" {
  value = aws_cloudfront_distribution.this.domain_name
}

output "hosted_zone_id" {
  description = "CloudFront's fixed hosted zone ID, used as the alias target zone_id in Route 53."
  value       = aws_cloudfront_distribution.this.hosted_zone_id
}
