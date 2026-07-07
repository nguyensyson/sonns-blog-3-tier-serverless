variable "api_name" {
  description = "Name of the REST API. Must match the api_gateway_name passed to the cloudwatch module."
  type        = string
}

variable "stage_name" {
  description = "Deployment stage name, e.g. \"dev\" or \"prod\". Also becomes the base path CloudFront must forward to (origin_path)."
  type        = string
}

variable "routes" {
  description = <<-EOT
    Map of top-level path prefix (no leading/trailing slash, e.g. "auth",
    "posts") to the backend Lambda function that should handle every request
    under that prefix. Each prefix gets its own "/{prefix}" exact-match route
    (e.g. bare "GET /groups") plus a "/{prefix}/{proxy+}" catch-all route
    (e.g. "POST /auth/register", "PUT /groups/reorder"), both routed to the
    same function. Multiple prefixes may point at the same function (e.g.
    "auth" and "users" both routed to the user function).
  EOT
  type = map(object({
    lambda_function_name = string
    lambda_invoke_arn    = string
  }))
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
