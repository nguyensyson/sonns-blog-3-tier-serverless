output "certificate_arn" {
  description = "ARN of the validated certificate. Use this, not the pre-validation certificate resource, as CloudFront's viewer_certificate.acm_certificate_arn."
  value       = aws_acm_certificate_validation.this.certificate_arn
}
