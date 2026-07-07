variable "domain_name" {
  description = "The hosted zone's domain name, e.g. \"example.com\"."
  type        = string
}

variable "create_zone" {
  description = "Whether to create the hosted zone. Set false to use an existing zone (looked up by domain_name) or when existing_zone_id is provided."
  type        = bool
  default     = true
}

variable "existing_zone_id" {
  description = "Zone ID to use directly, skipping zone creation/lookup. Typically the output of another instance of this module (e.g. the zone-creating call), used when this same module is instantiated again just to add records."
  type        = string
  default     = null
}

variable "records" {
  description = "Alias records to create in the zone (e.g. pointing the apex domain at CloudFront)."
  type = list(object({
    name                   = string
    type                   = string
    alias_name             = string
    alias_zone_id          = string
    evaluate_target_health = optional(bool, false)
  }))
  default = []
}

variable "tags" {
  description = "Tags applied to the hosted zone (only relevant when create_zone = true)."
  type        = map(string)
  default     = {}
}
