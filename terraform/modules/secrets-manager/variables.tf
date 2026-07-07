variable "secret_name" {
  description = "Name of the secret in Secrets Manager."
  type        = string
}

variable "description" {
  description = "Description of the secret."
  type        = string
  default     = ""
}

variable "placeholder_secret_string" {
  description = "Placeholder JSON string written on creation only. Real values must be set afterwards out-of-band (console/CLI/CI-CD) and are never stored in .tf or .tfvars files."
  type        = string
  default     = "{\"placeholder\":\"REPLACE_ME\"}"
}

variable "recovery_window_in_days" {
  description = "Number of days AWS waits before permanently deleting the secret after a destroy. 0 forces immediate deletion."
  type        = number
  default     = 7
}

variable "tags" {
  description = "Tags applied to the secret."
  type        = map(string)
  default     = {}
}
