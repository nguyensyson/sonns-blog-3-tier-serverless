output "lambda_log_group_name" {
  value = var.lambda_function_name != null ? aws_cloudwatch_log_group.lambda[0].name : null
}

output "lambda_log_group_arn" {
  value = var.lambda_function_name != null ? aws_cloudwatch_log_group.lambda[0].arn : null
}

output "api_gateway_log_group_name" {
  value = var.api_gateway_name != null ? aws_cloudwatch_log_group.api_gateway[0].name : null
}

output "api_gateway_log_group_arn" {
  value = var.api_gateway_name != null ? aws_cloudwatch_log_group.api_gateway[0].arn : null
}

output "sns_topic_arn" {
  description = "SNS topic that alarms publish to. Subscribe additional endpoints (Slack webhook via Chatbot, PagerDuty, etc.) as needed."
  value       = aws_sns_topic.alarms.arn
}
