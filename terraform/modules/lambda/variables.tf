variable "function_name" {
  description = "Name of the Lambda function."
  type        = string
}

variable "description" {
  description = "Description of the Lambda function."
  type        = string
  default     = ""
}

variable "handler" {
  description = "Function entrypoint, e.g. \"index.handler\"."
  type        = string
}

variable "runtime" {
  description = "Lambda runtime, e.g. \"nodejs20.x\"."
  type        = string
}

variable "memory_size" {
  description = "Memory (MB) allocated to the function."
  type        = number
  default     = 128
}

variable "timeout" {
  description = "Function timeout in seconds."
  type        = number
  default     = 10
}

variable "role_arn" {
  description = "ARN of the IAM execution role (from the iam module)."
  type        = string
}

variable "environment_variables" {
  description = "Environment variables passed to the function."
  type        = map(string)
  default     = {}
}

variable "source_dir" {
  description = "Path to the function source directory. Zipped automatically via archive_file. Ignored if deployment_package_path is set."
  type        = string
  default     = null
}

variable "deployment_package_path" {
  description = "Path to a pre-built .zip deployment package (e.g. produced by CI/CD). Takes precedence over source_dir."
  type        = string
  default     = null
}

variable "reserved_concurrent_executions" {
  description = "Reserved concurrency limit. -1 (default) means unreserved/unlimited, subject to the account limit."
  type        = number
  default     = -1
}

variable "layers" {
  description = "ARNs of Lambda Layers to attach (e.g. the shared common layer with FastAPI/boto3/JWT deps)."
  type        = list(string)
  default     = []
}

variable "tags" {
  description = "Tags applied to the function."
  type        = map(string)
  default     = {}
}
