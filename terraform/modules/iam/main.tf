data "aws_caller_identity" "current" {}

data "aws_region" "current" {}

data "aws_iam_policy_document" "lambda_assume_role" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "lambda_execution" {
  name               = "${var.name_prefix}-lambda-execution-role"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume_role.json
  tags               = var.tags
}

# Log group naming follows the Lambda module's /aws/lambda/<function_name> convention.
data "aws_iam_policy_document" "lambda_logging" {
  statement {
    sid     = "AllowLogCreation"
    effect  = "Allow"
    actions = ["logs:CreateLogGroup"]
    resources = [
      "arn:aws:logs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:*"
    ]
  }

  statement {
    sid     = "AllowLogStreaming"
    effect  = "Allow"
    actions = ["logs:CreateLogStream", "logs:PutLogEvents"]
    resources = [
      "arn:aws:logs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:log-group:/aws/lambda/*:*"
    ]
  }
}

resource "aws_iam_policy" "lambda_logging" {
  name   = "${var.name_prefix}-lambda-logging"
  policy = data.aws_iam_policy_document.lambda_logging.json
  tags   = var.tags
}

resource "aws_iam_role_policy_attachment" "lambda_logging" {
  role       = aws_iam_role.lambda_execution.name
  policy_arn = aws_iam_policy.lambda_logging.arn
}

data "aws_iam_policy_document" "lambda_data_access" {
  statement {
    sid    = "DynamoDBTableAccess"
    effect = "Allow"
    actions = [
      "dynamodb:GetItem",
      "dynamodb:PutItem",
      "dynamodb:UpdateItem",
      "dynamodb:DeleteItem",
      "dynamodb:Query",
      "dynamodb:Scan",
      "dynamodb:BatchGetItem",
      "dynamodb:BatchWriteItem",
    ]
    resources = var.dynamodb_table_arns
  }

  statement {
    sid    = "S3ImagesBucketAccess"
    effect = "Allow"
    actions = [
      "s3:GetObject",
      "s3:PutObject",
    ]
    resources = ["${var.s3_images_bucket_arn}/*"]
  }

  dynamic "statement" {
    for_each = length(var.secrets_manager_secret_arns) > 0 ? [1] : []
    content {
      sid       = "SecretsManagerAccess"
      effect    = "Allow"
      actions   = ["secretsmanager:GetSecretValue"]
      resources = var.secrets_manager_secret_arns
    }
  }
}

resource "aws_iam_policy" "lambda_data_access" {
  name   = "${var.name_prefix}-lambda-data-access"
  policy = data.aws_iam_policy_document.lambda_data_access.json
  tags   = var.tags
}

resource "aws_iam_role_policy_attachment" "lambda_data_access" {
  role       = aws_iam_role.lambda_execution.name
  policy_arn = aws_iam_policy.lambda_data_access.arn
}

# --- Account-level API Gateway CloudWatch logging role (singleton) ---

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
