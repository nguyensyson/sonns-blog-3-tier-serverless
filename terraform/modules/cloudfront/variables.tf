variable "aliases" {
  description = "Alternate domain names (CNAMEs) for the distribution, e.g. [\"www.example.com\"]."
  type        = list(string)
}

variable "certificate_arn" {
  description = "ARN of the ACM certificate (must be in us-east-1)."
  type        = string
}

variable "s3_bucket_regional_domain_name" {
  description = "Regional domain name of the frontend S3 bucket (from the s3-static-website module)."
  type        = string
}

variable "name_prefix" {
  description = "Prefix used to namespace account-global resources this module creates (e.g. CloudFront Functions), so multiple environments in the same account don't collide, e.g. \"myapp-dev\"."
  type        = string
}

variable "s3_origin_id" {
  description = "Identifier for the S3 origin."
  type        = string
  default     = "frontend-s3-origin"
}

variable "api_gateway_domain_name" {
  description = "Regional domain name of the API Gateway (from the api-gateway module's domain_name output)."
  type        = string
}

variable "api_gateway_origin_path" {
  description = "Path CloudFront prepends when forwarding to API Gateway, i.e. \"/<stage_name>\" (from the api-gateway module's origin_path output)."
  type        = string
}

variable "api_origin_id" {
  description = "Identifier for the API Gateway origin."
  type        = string
  default     = "api-gateway-origin"
}

variable "api_path_pattern" {
  description = "Path pattern routed to the API Gateway origin."
  type        = string
  default     = "/api/*"
}

variable "price_class" {
  description = "CloudFront price class: PriceClass_100 (cheapest, NA/EU), PriceClass_200, or PriceClass_All."
  type        = string
  default     = "PriceClass_100"
}

variable "default_root_object" {
  description = "Default root object for the distribution."
  type        = string
  default     = "index.html"
}

variable "tags" {
  description = "Tags applied to the distribution."
  type        = map(string)
  default     = {}
}
