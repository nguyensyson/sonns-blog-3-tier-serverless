output "lambda_log_group_name" {
  value = aws_cloudwatch_log_group.lambda.name
}

output "lambda_log_group_arn" {
  value = aws_cloudwatch_log_group.lambda.arn
}

output "api_gateway_log_group_name" {
  value = aws_cloudwatch_log_group.api_gateway.name
}

output "api_gateway_log_group_arn" {
  value = aws_cloudwatch_log_group.api_gateway.arn
}

output "sns_topic_arn" {
  description = "SNS topic that alarms publish to. Subscribe additional endpoints (Slack webhook via Chatbot, PagerDuty, etc.) as needed."
  value       = aws_sns_topic.alarms.arn
}
