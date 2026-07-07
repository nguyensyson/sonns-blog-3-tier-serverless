resource "aws_secretsmanager_secret" "this" {
  name                    = var.secret_name
  description             = var.description
  recovery_window_in_days = var.recovery_window_in_days
  tags                    = var.tags
}

# Seeds a placeholder value so the secret is usable immediately after apply.
# The real value is set later out-of-band; ignore_changes prevents `terraform
# apply` from ever overwriting it back to the placeholder.
resource "aws_secretsmanager_secret_version" "this" {
  secret_id     = aws_secretsmanager_secret.this.id
  secret_string = var.placeholder_secret_string

  lifecycle {
    ignore_changes = [secret_string]
  }
}
