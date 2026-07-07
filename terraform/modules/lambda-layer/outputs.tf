output "layer_arn" {
  description = "Versioned ARN of the Lambda Layer - pass this into the `layers` list of any function that needs it."
  value       = aws_lambda_layer_version.this.arn
}

output "layer_version" {
  value = aws_lambda_layer_version.this.version
}
