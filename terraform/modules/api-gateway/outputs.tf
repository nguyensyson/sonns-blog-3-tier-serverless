output "api_id" {
  value = aws_api_gateway_rest_api.this.id
}

output "execution_arn" {
  value = aws_api_gateway_rest_api.this.execution_arn
}

output "stage_name" {
  value = aws_api_gateway_stage.this.stage_name
}

output "invoke_url" {
  value = aws_api_gateway_stage.this.invoke_url
}

output "domain_name" {
  description = "Regional domain name to use as the CloudFront custom origin (without stage path)."
  value       = "${aws_api_gateway_rest_api.this.id}.execute-api.${data.aws_region.current.name}.amazonaws.com"
}

output "origin_path" {
  description = "Path CloudFront must prepend when forwarding to this origin, i.e. the stage name."
  value       = "/${aws_api_gateway_stage.this.stage_name}"
}

data "aws_region" "current" {}
