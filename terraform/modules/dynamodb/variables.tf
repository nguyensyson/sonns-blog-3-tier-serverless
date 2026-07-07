variable "table_name" {
  description = "Name of the DynamoDB table."
  type        = string
}

variable "billing_mode" {
  description = "PAY_PER_REQUEST (recommended for small/variable workloads) or PROVISIONED."
  type        = string
  default     = "PAY_PER_REQUEST"

  validation {
    condition     = contains(["PAY_PER_REQUEST", "PROVISIONED"], var.billing_mode)
    error_message = "billing_mode must be PAY_PER_REQUEST or PROVISIONED."
  }
}

variable "hash_key" {
  description = "Partition key name."
  type        = string
}

variable "hash_key_type" {
  description = "Partition key type: S, N, or B."
  type        = string
  default     = "S"
}

variable "range_key" {
  description = "Sort key name. Leave null for a table with no sort key."
  type        = string
  default     = null
}

variable "range_key_type" {
  description = "Sort key type: S, N, or B."
  type        = string
  default     = "S"
}

variable "read_capacity" {
  description = "Read capacity units. Only used when billing_mode = PROVISIONED."
  type        = number
  default     = 5
}

variable "write_capacity" {
  description = "Write capacity units. Only used when billing_mode = PROVISIONED."
  type        = number
  default     = 5
}

variable "global_secondary_indexes" {
  description = "Optional list of GSIs."
  type = list(object({
    name            = string
    hash_key        = string
    range_key       = optional(string)
    projection_type = optional(string, "ALL")
    read_capacity   = optional(number)
    write_capacity  = optional(number)
  }))
  default = []
}

variable "additional_attributes" {
  description = "Extra attribute definitions required by GSIs (beyond hash_key/range_key), as a map of attribute name => type."
  type        = map(string)
  default     = {}
}

variable "enable_point_in_time_recovery" {
  description = "Enable continuous backups (PITR)."
  type        = bool
  default     = true
}

variable "tags" {
  description = "Tags applied to the table."
  type        = map(string)
  default     = {}
}
