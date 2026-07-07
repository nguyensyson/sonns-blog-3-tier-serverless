variable "domain_name" {
  description = "Primary domain name for the certificate."
  type        = string
}

variable "subject_alternative_names" {
  description = "Additional domain names covered by the certificate (e.g. www.example.com)."
  type        = list(string)
  default     = []
}

variable "route53_zone_id" {
  description = "Hosted zone ID used to create DNS validation records."
  type        = string
}

variable "tags" {
  description = "Tags applied to the certificate."
  type        = map(string)
  default     = {}
}
