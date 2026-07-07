variable "lambda_function_name" {
  description = "Name of the Lambda function to create a log group and alarms for (must match the name the lambda module will use). Set to null to skip the Lambda log group/alarms entirely (e.g. a module call dedicated only to API Gateway monitoring)."
  type        = string
  default     = null
}

variable "api_gateway_name" {
  description = "Name of the API Gateway REST API to create a log group and alarms for (must match the name the api-gateway module will use). Set to null to skip the API Gateway log group/alarms entirely (e.g. a module call dedicated only to one Lambda function's monitoring)."
  type        = string
  default     = null
}

variable "alarm_topic_name" {
  description = "Name used for the SNS alarm topic (\"<name>-alarms\"). Defaults to lambda_function_name, then api_gateway_name, whichever is set."
  type        = string
  default     = null
}

variable "lambda_log_retention_days" {
  description = "Retention in days for the Lambda log group."
  type        = number
  default     = 30
}

variable "api_gateway_log_retention_days" {
  description = "Retention in days for the API Gateway access log group."
  type        = number
  default     = 30
}

variable "lambda_error_threshold" {
  description = "Number of Lambda errors within the evaluation period that triggers the alarm."
  type        = number
  default     = 1
}

variable "lambda_throttle_threshold" {
  description = "Number of Lambda throttles within the evaluation period that triggers the alarm."
  type        = number
  default     = 1
}

variable "api_gateway_5xx_threshold" {
  description = "Number of API Gateway 5XX errors within the evaluation period that triggers the alarm."
  type        = number
  default     = 1
}

variable "api_gateway_4xx_threshold" {
  description = "Number of API Gateway 4XX errors within the evaluation period that triggers the alarm."
  type        = number
  default     = 50
}

variable "alarm_evaluation_period_seconds" {
  description = "Period (seconds) for alarm metric evaluation."
  type        = number
  default     = 300
}

variable "alarm_email" {
  description = "Optional email address subscribed to the alarm SNS topic. Leave empty to skip the subscription."
  type        = string
  default     = ""
}

variable "tags" {
  description = "Tags applied to log groups, alarms, and the SNS topic."
  type        = map(string)
  default     = {}
}
