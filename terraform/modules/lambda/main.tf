locals {
  use_prebuilt_package = var.deployment_package_path != null
}

# Only used when no pre-built package is supplied (e.g. local/dev workflow).
data "archive_file" "source" {
  count       = local.use_prebuilt_package ? 0 : 1
  type        = "zip"
  source_dir  = var.source_dir
  output_path = "${path.module}/.build/${var.function_name}.zip"
}

resource "aws_lambda_function" "this" {
  function_name = var.function_name
  description   = var.description
  role          = var.role_arn
  handler       = var.handler
  runtime       = var.runtime
  memory_size   = var.memory_size
  timeout       = var.timeout

  reserved_concurrent_executions = var.reserved_concurrent_executions
  layers                         = var.layers

  filename         = local.use_prebuilt_package ? var.deployment_package_path : data.archive_file.source[0].output_path
  source_code_hash = local.use_prebuilt_package ? filebase64sha256(var.deployment_package_path) : data.archive_file.source[0].output_base64sha256

  dynamic "environment" {
    for_each = length(var.environment_variables) > 0 ? [1] : []
    content {
      variables = var.environment_variables
    }
  }

  tags = var.tags
}
