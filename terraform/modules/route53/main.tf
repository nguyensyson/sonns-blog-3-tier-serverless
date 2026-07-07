resource "aws_route53_zone" "this" {
  count = var.existing_zone_id == null && var.create_zone ? 1 : 0
  name  = var.domain_name
  tags  = var.tags
}

data "aws_route53_zone" "existing" {
  count = var.existing_zone_id == null && !var.create_zone ? 1 : 0
  name  = var.domain_name
}

locals {
  zone_id = (
    var.existing_zone_id != null ? var.existing_zone_id :
    var.create_zone ? aws_route53_zone.this[0].zone_id :
    data.aws_route53_zone.existing[0].zone_id
  )
}

resource "aws_route53_record" "alias" {
  for_each = { for r in var.records : "${r.name}-${r.type}" => r }

  zone_id = local.zone_id
  name    = each.value.name
  type    = each.value.type

  alias {
    name                   = each.value.alias_name
    zone_id                = each.value.alias_zone_id
    evaluate_target_health = each.value.evaluate_target_health
  }
}
