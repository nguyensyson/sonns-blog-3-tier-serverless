output "cloudfront_domain_name" {
  value = module.cloudfront.domain_name
}

output "site_url" {
  value = "https://${var.site_domain_name}"
}

output "api_invoke_url" {
  value = module.api_gateway.invoke_url
}

output "route53_name_servers" {
  description = "If this environment created the hosted zone, set these as the NS records at your domain registrar."
  value       = module.route53_zone.name_servers
}

output "dynamodb_table_name" {
  value = module.dynamodb.table_name
}

output "images_bucket_name" {
  value = module.s3_images_bucket.bucket_id
}

output "frontend_bucket_name" {
  value = module.s3_static_website.bucket_id
}

output "secret_name" {
  value = module.secrets_manager.secret_name
}

output "lambda_function_name" {
  value = module.lambda.function_name
}
