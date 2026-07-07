locals {
  # Multiple prefixes can point at the same Lambda function (e.g. "auth" and
  # "users" both go to the user function); dedupe so each function only gets
  # one aws_lambda_permission statement.
  unique_functions = { for name in distinct([for r in var.routes : r.lambda_function_name]) : name => name }
}

resource "aws_api_gateway_rest_api" "this" {
  name = var.api_name
  tags = var.tags

  endpoint_configuration {
    types = ["REGIONAL"]
  }
}

# One resource per top-level path prefix (e.g. "auth", "posts", "groups"),
# each routed to whichever backend Lambda function var.routes assigns it.
resource "aws_api_gateway_resource" "prefix" {
  for_each    = var.routes
  rest_api_id = aws_api_gateway_rest_api.this.id
  parent_id   = aws_api_gateway_rest_api.this.root_resource_id
  path_part   = each.key
}

resource "aws_api_gateway_resource" "prefix_proxy" {
  for_each    = var.routes
  rest_api_id = aws_api_gateway_rest_api.this.id
  parent_id   = aws_api_gateway_resource.prefix[each.key].id
  path_part   = "{proxy+}"
}

# Exact match on the prefix itself - e.g. "GET /groups", "POST /posts" with no
# further path segments.
resource "aws_api_gateway_method" "prefix_any" {
  for_each         = var.routes
  rest_api_id      = aws_api_gateway_rest_api.this.id
  resource_id      = aws_api_gateway_resource.prefix[each.key].id
  http_method      = "ANY"
  authorization    = "NONE"
  api_key_required = false
}

resource "aws_api_gateway_integration" "prefix_lambda" {
  for_each                = var.routes
  rest_api_id             = aws_api_gateway_rest_api.this.id
  resource_id             = aws_api_gateway_resource.prefix[each.key].id
  http_method             = aws_api_gateway_method.prefix_any[each.key].http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = each.value.lambda_invoke_arn
}

# Catch-all for anything under the prefix - e.g. "POST /auth/register",
# "PUT /groups/{id}/tasks", "PUT /groups/reorder".
resource "aws_api_gateway_method" "prefix_proxy_any" {
  for_each         = var.routes
  rest_api_id      = aws_api_gateway_rest_api.this.id
  resource_id      = aws_api_gateway_resource.prefix_proxy[each.key].id
  http_method      = "ANY"
  authorization    = "NONE"
  api_key_required = false
}

resource "aws_api_gateway_integration" "prefix_proxy_lambda" {
  for_each                = var.routes
  rest_api_id             = aws_api_gateway_rest_api.this.id
  resource_id             = aws_api_gateway_resource.prefix_proxy[each.key].id
  http_method             = aws_api_gateway_method.prefix_proxy_any[each.key].http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = each.value.lambda_invoke_arn
}

resource "aws_api_gateway_deployment" "this" {
  rest_api_id = aws_api_gateway_rest_api.this.id

  triggers = {
    redeployment = sha1(jsonencode({
      resources          = { for k, r in aws_api_gateway_resource.prefix : k => r.id }
      proxy_resources    = { for k, r in aws_api_gateway_resource.prefix_proxy : k => r.id }
      methods            = { for k, m in aws_api_gateway_method.prefix_any : k => m.id }
      proxy_methods      = { for k, m in aws_api_gateway_method.prefix_proxy_any : k => m.id }
      integrations       = { for k, i in aws_api_gateway_integration.prefix_lambda : k => i.id }
      proxy_integrations = { for k, i in aws_api_gateway_integration.prefix_proxy_lambda : k => i.id }
    }))
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_api_gateway_stage" "this" {
  rest_api_id   = aws_api_gateway_rest_api.this.id
  deployment_id = aws_api_gateway_deployment.this.id
  stage_name    = var.stage_name
  tags          = var.tags

  access_log_settings {
    destination_arn = var.access_log_group_arn
    format = jsonencode({
      requestId        = "$context.requestId"
      ip               = "$context.identity.sourceIp"
      requestTime      = "$context.requestTime"
      httpMethod       = "$context.httpMethod"
      resourcePath     = "$context.resourcePath"
      status           = "$context.status"
      protocol         = "$context.protocol"
      responseLength   = "$context.responseLength"
      integrationError = "$context.integration.error"
    })
  }
}

resource "aws_api_gateway_method_settings" "this" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  stage_name  = aws_api_gateway_stage.this.stage_name
  method_path = "*/*"

  settings {
    logging_level          = "INFO"
    data_trace_enabled     = false
    metrics_enabled        = true
    throttling_rate_limit  = var.throttling_rate_limit
    throttling_burst_limit = var.throttling_burst_limit
  }
}

resource "aws_lambda_permission" "apigw_invoke" {
  for_each      = local.unique_functions
  statement_id  = "AllowAPIGatewayInvoke-${each.key}"
  action        = "lambda:InvokeFunction"
  function_name = each.key
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.this.execution_arn}/*/*"
}
