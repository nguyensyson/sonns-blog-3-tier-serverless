variable "bucket_name" {
  description = "Globally-unique name for the frontend bucket."
  type        = string
}

variable "enable_versioning" {
  description = "Enable object versioning."
  type        = bool
  default     = true
}

variable "tags" {
  description = "Tags applied to the bucket."
  type        = map(string)
  default     = {}
}
