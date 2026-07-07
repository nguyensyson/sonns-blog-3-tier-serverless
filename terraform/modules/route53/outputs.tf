output "zone_id" {
  value = local.zone_id
}

output "name_servers" {
  description = "Name servers for the zone (only populated when this call creates the zone; set your registrar's NS records to these)."
  value       = var.create_zone && var.existing_zone_id == null ? aws_route53_zone.this[0].name_servers : []
}
