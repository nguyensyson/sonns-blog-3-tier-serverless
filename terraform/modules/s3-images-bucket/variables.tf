variable "bucket_name" {
  description = "Globally-unique name for the images bucket."
  type        = string
}

variable "enable_versioning" {
  description = "Enable object versioning."
  type        = bool
  default     = true
}

variable "lifecycle_rules" {
  description = "Optional lifecycle rules, e.g. to transition/expire old image versions."
  type = list(object({
    id                                 = string
    enabled                            = bool
    prefix                             = optional(string, "")
    noncurrent_version_expiration_days = optional(number)
    expiration_days                    = optional(number)
  }))
  default = []
}

variable "cors_rules" {
  description = "Optional CORS rules, e.g. if the frontend ever needs direct browser upload/download."
  type = list(object({
    allowed_headers = list(string)
    allowed_methods = list(string)
    allowed_origins = list(string)
    expose_headers  = optional(list(string), [])
    max_age_seconds = optional(number, 3000)
  }))
  default = []
}

variable "tags" {
  description = "Tags applied to the bucket."
  type        = map(string)
  default     = {}
}
