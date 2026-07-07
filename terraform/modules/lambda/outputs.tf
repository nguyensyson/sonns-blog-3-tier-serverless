output "function_name" {
  value = aws_lambda_function.this.function_name
}

output "function_arn" {
  value = aws_lambda_function.this.arn
}

output "invoke_arn" {
  description = "Invoke ARN used by API Gateway's Lambda proxy integration."
  value       = aws_lambda_function.this.invoke_arn
}
