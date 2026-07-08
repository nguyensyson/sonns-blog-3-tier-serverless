variable "name_prefix" {
  description = "Prefix used to name the account-level API Gateway CloudWatch role (e.g. \"blog-spa-dev\")."
  type        = string
}

variable "manage_apigateway_account_settings" {
  description = <<-EOT
    Whether this module manages the account/region-wide API Gateway CloudWatch
    logging role (aws_api_gateway_account). This setting is a SINGLETON per
    AWS account + region - if dev and prod share an account, set this to true
    in exactly ONE environment (recommended: the first one you deploy) and
    false in the others, otherwise their applies will fight over it.
  EOT
  type        = bool
  default     = false
}

variable "tags" {
  description = "Tags applied to the IAM role."
  type        = map(string)
  default     = {}
}
