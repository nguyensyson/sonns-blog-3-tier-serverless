data "aws_caller_identity" "current" {}

locals {
  common_tags = merge(
    {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "terraform"
      Owner       = var.owner
    },
    var.cost_center != "" ? { CostCenter = var.cost_center } : {}
  )

  name_prefix          = "${var.project_name}-${var.environment}"
  lambda_function_name = "${local.name_prefix}-app"
  api_name             = "${local.name_prefix}-api"
  dynamodb_table_name  = "${local.name_prefix}-table"
  secret_name          = "${local.name_prefix}-app-secret"
  images_bucket_name   = "${local.name_prefix}-images-${data.aws_caller_identity.current.account_id}"
  frontend_bucket_name = "${local.name_prefix}-frontend-${data.aws_caller_identity.current.account_id}"
}

# --- Tier 3: Data ---

module "dynamodb" {
  source = "../../modules/dynamodb"

  table_name   = local.dynamodb_table_name
  billing_mode = var.dynamodb_billing_mode
  hash_key     = var.dynamodb_hash_key
  tags         = local.common_tags
}

module "secrets_manager" {
  source = "../../modules/secrets-manager"

  secret_name = local.secret_name
  description = var.secret_description
  tags        = local.common_tags
}

module "s3_images_bucket" {
  source = "../../modules/s3-images-bucket"

  bucket_name = local.images_bucket_name
  tags        = local.common_tags
}

module "iam" {
  source = "../../modules/iam"

  name_prefix                        = local.name_prefix
  dynamodb_table_arns                = [module.dynamodb.table_arn]
  s3_images_bucket_arn               = module.s3_images_bucket.bucket_arn
  secrets_manager_secret_arns        = [module.secrets_manager.secret_arn]
  manage_apigateway_account_settings = var.manage_apigateway_account_settings
  tags                               = local.common_tags
}

# --- Monitoring (log groups must exist before Lambda/API Gateway first write to them) ---

module "cloudwatch" {
  source = "../../modules/cloudwatch"

  lambda_function_name           = local.lambda_function_name
  api_gateway_name               = local.api_name
  lambda_log_retention_days      = var.log_retention_days
  api_gateway_log_retention_days = var.log_retention_days
  alarm_email                    = var.alarm_email
  tags                           = local.common_tags
}

# --- Tier 2: Application/Logic ---

module "lambda" {
  source = "../../modules/lambda"

  function_name = local.lambda_function_name
  handler       = var.lambda_handler
  runtime       = var.lambda_runtime
  memory_size   = var.lambda_memory_size
  timeout       = var.lambda_timeout
  role_arn      = module.iam.lambda_role_arn
  source_dir    = var.lambda_source_dir

  environment_variables = {
    DYNAMODB_TABLE_NAME = module.dynamodb.table_name
    IMAGES_BUCKET_NAME  = module.s3_images_bucket.bucket_id
    SECRET_NAME         = module.secrets_manager.secret_name
    SECRET_ARN          = module.secrets_manager.secret_arn
    ENVIRONMENT         = var.environment
  }

  tags       = local.common_tags
  depends_on = [module.cloudwatch]
}

module "api_gateway" {
  source = "../../modules/api-gateway"

  api_name             = local.api_name
  stage_name           = var.environment
  lambda_function_name = module.lambda.function_name
  lambda_invoke_arn    = module.lambda.invoke_arn
  access_log_group_arn = module.cloudwatch.api_gateway_log_group_arn
  tags                 = local.common_tags
}

# --- Tier 1: Presentation ---

module "route53_zone" {
  source = "../../modules/route53"

  domain_name = var.root_domain_name
  create_zone = var.create_route53_zone
  tags        = local.common_tags
}

module "acm" {
  source    = "../../modules/acm"
  providers = { aws = aws.us_east_1 }

  domain_name     = var.site_domain_name
  route53_zone_id = module.route53_zone.zone_id
  tags            = local.common_tags
}

module "s3_static_website" {
  source = "../../modules/s3-static-website"

  bucket_name = local.frontend_bucket_name
  tags        = local.common_tags
}

module "cloudfront" {
  source = "../../modules/cloudfront"

  aliases                        = [var.site_domain_name]
  certificate_arn                = module.acm.certificate_arn
  s3_bucket_regional_domain_name = module.s3_static_website.bucket_regional_domain_name
  api_gateway_domain_name        = module.api_gateway.domain_name
  api_gateway_origin_path        = module.api_gateway.origin_path
  tags                           = local.common_tags
}

# The frontend bucket policy lives here (not inside either module) to avoid a
# circular module dependency: cloudfront needs the bucket's domain name, and
# this policy needs cloudfront's distribution ARN.
data "aws_iam_policy_document" "frontend_oac" {
  statement {
    effect    = "Allow"
    actions   = ["s3:GetObject"]
    resources = ["${module.s3_static_website.bucket_arn}/*"]

    principals {
      type        = "Service"
      identifiers = ["cloudfront.amazonaws.com"]
    }

    condition {
      test     = "StringEquals"
      variable = "AWS:SourceArn"
      values   = [module.cloudfront.distribution_arn]
    }
  }
}

resource "aws_s3_bucket_policy" "frontend_oac" {
  bucket = module.s3_static_website.bucket_id
  policy = data.aws_iam_policy_document.frontend_oac.json
}

module "route53_records" {
  source = "../../modules/route53"

  domain_name      = var.root_domain_name
  create_zone      = false
  existing_zone_id = module.route53_zone.zone_id

  records = [
    {
      name          = var.site_domain_name
      type          = "A"
      alias_name    = module.cloudfront.domain_name
      alias_zone_id = module.cloudfront.hosted_zone_id
    },
    {
      name          = var.site_domain_name
      type          = "AAAA"
      alias_name    = module.cloudfront.domain_name
      alias_zone_id = module.cloudfront.hosted_zone_id
    },
  ]

  tags = local.common_tags
}
