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

output "users_table_name" {
  value = module.dynamodb_users.table_name
}

output "posts_table_name" {
  value = module.dynamodb_posts.table_name
}

output "groups_table_name" {
  value = module.dynamodb_groups.table_name
}

output "tasks_table_name" {
  value = module.dynamodb_tasks.table_name
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

output "common_layer_arn" {
  value = module.lambda_layer_common.layer_arn
}

output "user_function_name" {
  value = module.lambda_user.function_name
}

output "posts_function_name" {
  value = module.lambda_posts.function_name
}

output "tasks_function_name" {
  value = module.lambda_tasks.function_name
}
