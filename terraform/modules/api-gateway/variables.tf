variable "api_name" {
  description = "Name of the REST API. Must match the api_gateway_name passed to the cloudwatch module."
  type        = string
}

variable "stage_name" {
  description = "Deployment stage name, e.g. \"dev\" or \"prod\". Also becomes the base path CloudFront must forward to (origin_path)."
  type        = string
}

variable "lambda_function_name" {
  description = "Name of the Lambda function to invoke (used for the invoke permission)."
  type        = string
}

variable "lambda_invoke_arn" {
  description = "Invoke ARN of the Lambda function (from the lambda module)."
  type        = string
}

variable "access_log_group_arn" {
  description = "ARN of the CloudWatch log group to write access logs to (from the cloudwatch module)."
  type        = string
}

variable "throttling_rate_limit" {
  description = "Steady-state request rate limit per second for the stage."
  type        = number
  default     = 50
}

variable "throttling_burst_limit" {
  description = "Burst request limit for the stage."
  type        = number
  default     = 100
}

variable "tags" {
  description = "Tags applied to the API."
  type        = map(string)
  default     = {}
}
