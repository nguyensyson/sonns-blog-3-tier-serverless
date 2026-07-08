# --- Account-level API Gateway CloudWatch logging role (singleton) ---
#
# This is the ONLY thing left in this module after the Lambda execution role
# migrated to the SAM template (see sam/template.yaml) - it's an
# account/region-wide setting unrelated to any single API, so it stays here
# rather than being recreated by every SAM stack.

data "aws_iam_policy_document" "apigateway_assume_role" {
  count = var.manage_apigateway_account_settings ? 1 : 0

  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["apigateway.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "apigateway_cloudwatch" {
  count              = var.manage_apigateway_account_settings ? 1 : 0
  name               = "${var.name_prefix}-apigateway-cloudwatch-role"
  assume_role_policy = data.aws_iam_policy_document.apigateway_assume_role[0].json
  tags               = var.tags
}

resource "aws_iam_role_policy_attachment" "apigateway_cloudwatch" {
  count      = var.manage_apigateway_account_settings ? 1 : 0
  role       = aws_iam_role.apigateway_cloudwatch[0].name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonAPIGatewayPushToCloudWatchLogs"
}

resource "aws_api_gateway_account" "this" {
  count               = var.manage_apigateway_account_settings ? 1 : 0
  cloudwatch_role_arn = aws_iam_role.apigateway_cloudwatch[0].arn
  depends_on          = [aws_iam_role_policy_attachment.apigateway_cloudwatch]
}
