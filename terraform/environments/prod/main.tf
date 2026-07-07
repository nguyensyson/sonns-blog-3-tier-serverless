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

  name_prefix = "${var.project_name}-${var.environment}"
  api_name    = "${local.name_prefix}-api"

  users_table_name  = "${local.name_prefix}-users"
  posts_table_name  = "${local.name_prefix}-posts"
  groups_table_name = "${local.name_prefix}-groups"
  tasks_table_name  = "${local.name_prefix}-tasks"

  common_layer_name   = "${local.name_prefix}-common-layer"
  user_function_name  = "${local.name_prefix}-user"
  posts_function_name = "${local.name_prefix}-posts"
  tasks_function_name = "${local.name_prefix}-tasks"

  secret_name          = "${local.name_prefix}-app-secret"
  images_bucket_name   = "${local.name_prefix}-images-${data.aws_caller_identity.current.account_id}"
  frontend_bucket_name = "${local.name_prefix}-frontend-${data.aws_caller_identity.current.account_id}"
}

# --- Tier 3: Data ---
# 4 tables, one per entity - see backend/shared/dynamodb-schema.md for the
# full field list and the rationale behind each GSI.

module "dynamodb_users" {
  source = "../../modules/dynamodb"

  table_name   = local.users_table_name
  billing_mode = var.dynamodb_billing_mode
  hash_key     = "userId"

  global_secondary_indexes = [
    { name = "email-index", hash_key = "email", projection_type = "ALL" },
  ]
  additional_attributes = { email = "S" }

  tags = local.common_tags
}

module "dynamodb_posts" {
  source = "../../modules/dynamodb"

  table_name   = local.posts_table_name
  billing_mode = var.dynamodb_billing_mode
  hash_key     = "postId"

  global_secondary_indexes = [
    { name = "authorId-createdAt-index", hash_key = "authorId", range_key = "createdAt", projection_type = "ALL" },
    { name = "category-createdAt-index", hash_key = "category", range_key = "createdAt", projection_type = "ALL" },
  ]
  additional_attributes = {
    authorId  = "S"
    category  = "S"
    createdAt = "S"
  }

  tags = local.common_tags
}

module "dynamodb_groups" {
  source = "../../modules/dynamodb"

  table_name   = local.groups_table_name
  billing_mode = var.dynamodb_billing_mode
  hash_key     = "groupId"

  global_secondary_indexes = [
    { name = "userId-order-index", hash_key = "userId", range_key = "order", projection_type = "ALL" },
  ]
  additional_attributes = {
    userId = "S"
    order  = "N"
  }

  tags = local.common_tags
}

module "dynamodb_tasks" {
  source = "../../modules/dynamodb"

  table_name   = local.tasks_table_name
  billing_mode = var.dynamodb_billing_mode
  hash_key     = "taskId"

  global_secondary_indexes = [
    { name = "groupId-order-index", hash_key = "groupId", range_key = "order", projection_type = "ALL" },
    # isDone is stored as Number (0/1), not native Boolean - DynamoDB key
    # attributes only support S/N/B. See backend/shared/dynamodb-schema.md.
    { name = "userId-isDone-index", hash_key = "userId", range_key = "isDone", projection_type = "ALL" },
  ]
  additional_attributes = {
    groupId = "S"
    order   = "N"
    userId  = "S"
    isDone  = "N"
  }

  tags = local.common_tags
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

# --- IAM ---
# One shared execution role for all 3 functions, scoped to exactly the 4
# tables (+ their GSIs), the images bucket, and the shared secret - no
# wildcards. Splitting into 3 least-privilege roles (e.g. user doesn't need
# S3 access at all) is a reasonable follow-up but adds module complexity
# (the iam module's singleton API Gateway account settings would need to be
# gated to only one of the three calls); not required for this to function.

module "iam" {
  source = "../../modules/iam"

  name_prefix = local.name_prefix
  dynamodb_table_arns = concat(
    [module.dynamodb_users.table_arn], module.dynamodb_users.gsi_arns,
    [module.dynamodb_posts.table_arn], module.dynamodb_posts.gsi_arns,
    [module.dynamodb_groups.table_arn], module.dynamodb_groups.gsi_arns,
    [module.dynamodb_tasks.table_arn], module.dynamodb_tasks.gsi_arns,
  )
  s3_images_bucket_arn               = module.s3_images_bucket.bucket_arn
  secrets_manager_secret_arns        = [module.secrets_manager.secret_arn]
  manage_apigateway_account_settings = var.manage_apigateway_account_settings
  tags                               = local.common_tags
}

# --- Monitoring (log groups must exist before Lambda/API Gateway first write to them) ---
# One cloudwatch module call per Lambda function, plus one more dedicated to
# the (single, shared) API Gateway REST API.

module "cloudwatch_user" {
  source = "../../modules/cloudwatch"

  lambda_function_name      = local.user_function_name
  lambda_log_retention_days = var.log_retention_days
  alarm_email               = var.alarm_email
  tags                      = local.common_tags
}

module "cloudwatch_posts" {
  source = "../../modules/cloudwatch"

  lambda_function_name      = local.posts_function_name
  lambda_log_retention_days = var.log_retention_days
  alarm_email               = var.alarm_email
  tags                      = local.common_tags
}

module "cloudwatch_tasks" {
  source = "../../modules/cloudwatch"

  lambda_function_name      = local.tasks_function_name
  lambda_log_retention_days = var.log_retention_days
  alarm_email               = var.alarm_email
  tags                      = local.common_tags
}

module "cloudwatch_api" {
  source = "../../modules/cloudwatch"

  api_gateway_name               = local.api_name
  api_gateway_log_retention_days = var.log_retention_days
  alarm_email                    = var.alarm_email
  tags                           = local.common_tags
}

# --- Tier 2: Application/Logic ---

module "lambda_layer_common" {
  source = "../../modules/lambda-layer"

  layer_name          = local.common_layer_name
  description         = "Shared FastAPI/DynamoDB/JWT/S3 helpers used by all 3 backend Lambda functions (backend/layers/common)."
  compatible_runtimes = [var.lambda_runtime]
  source_dir          = var.lambda_layer_source_dir
  layer_zip_path      = var.lambda_layer_zip_path
}

module "lambda_user" {
  source = "../../modules/lambda"

  function_name = local.user_function_name
  handler       = var.lambda_handler
  runtime       = var.lambda_runtime
  memory_size   = var.lambda_memory_size
  timeout       = var.lambda_timeout
  role_arn      = module.iam.lambda_role_arn
  source_dir    = var.lambda_user_source_dir
  layers        = [module.lambda_layer_common.layer_arn]

  environment_variables = {
    USERS_TABLE_NAME   = module.dynamodb_users.table_name
    SECRET_NAME        = module.secrets_manager.secret_name
    SECRET_ARN         = module.secrets_manager.secret_arn
    ENVIRONMENT        = var.environment
    CORS_ALLOW_ORIGINS = var.cors_allow_origins
  }

  tags       = local.common_tags
  depends_on = [module.cloudwatch_user]
}

module "lambda_posts" {
  source = "../../modules/lambda"

  function_name = local.posts_function_name
  handler       = var.lambda_handler
  runtime       = var.lambda_runtime
  memory_size   = var.lambda_memory_size
  timeout       = var.lambda_timeout
  role_arn      = module.iam.lambda_role_arn
  source_dir    = var.lambda_posts_source_dir
  layers        = [module.lambda_layer_common.layer_arn]

  environment_variables = {
    POSTS_TABLE_NAME   = module.dynamodb_posts.table_name
    IMAGES_BUCKET_NAME = module.s3_images_bucket.bucket_id
    SECRET_NAME        = module.secrets_manager.secret_name
    SECRET_ARN         = module.secrets_manager.secret_arn
    ENVIRONMENT        = var.environment
    CORS_ALLOW_ORIGINS = var.cors_allow_origins
  }

  tags       = local.common_tags
  depends_on = [module.cloudwatch_posts]
}

module "lambda_tasks" {
  source = "../../modules/lambda"

  function_name = local.tasks_function_name
  handler       = var.lambda_handler
  runtime       = var.lambda_runtime
  memory_size   = var.lambda_memory_size
  timeout       = var.lambda_timeout
  role_arn      = module.iam.lambda_role_arn
  source_dir    = var.lambda_tasks_source_dir
  layers        = [module.lambda_layer_common.layer_arn]

  environment_variables = {
    GROUPS_TABLE_NAME  = module.dynamodb_groups.table_name
    TASKS_TABLE_NAME   = module.dynamodb_tasks.table_name
    SECRET_NAME        = module.secrets_manager.secret_name
    SECRET_ARN         = module.secrets_manager.secret_arn
    ENVIRONMENT        = var.environment
    CORS_ALLOW_ORIGINS = var.cors_allow_origins
  }

  tags       = local.common_tags
  depends_on = [module.cloudwatch_tasks]
}

module "api_gateway" {
  source = "../../modules/api-gateway"

  api_name   = local.api_name
  stage_name = var.environment

  # auth/users -> user function; posts (blog+diary+upload-image) -> posts
  # function; groups/tasks -> tasks function. See backend/README.md for the
  # full endpoint list.
  routes = {
    auth = {
      lambda_function_name = module.lambda_user.function_name
      lambda_invoke_arn    = module.lambda_user.invoke_arn
    }
    users = {
      lambda_function_name = module.lambda_user.function_name
      lambda_invoke_arn    = module.lambda_user.invoke_arn
    }
    posts = {
      lambda_function_name = module.lambda_posts.function_name
      lambda_invoke_arn    = module.lambda_posts.invoke_arn
    }
    groups = {
      lambda_function_name = module.lambda_tasks.function_name
      lambda_invoke_arn    = module.lambda_tasks.invoke_arn
    }
    tasks = {
      lambda_function_name = module.lambda_tasks.function_name
      lambda_invoke_arn    = module.lambda_tasks.invoke_arn
    }
  }

  access_log_group_arn = module.cloudwatch_api.api_gateway_log_group_arn
  tags                 = local.common_tags

  # Stage creation enables access logging, which requires the account-level
  # CloudWatch role (module.iam.aws_api_gateway_account) to exist first -
  # there's no implicit reference between the two modules otherwise.
  depends_on = [module.iam]
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

  name_prefix                    = local.name_prefix
  aliases                        = [var.site_domain_name]
  certificate_arn                = module.acm.certificate_arn
  s3_bucket_regional_domain_name = module.s3_static_website.bucket_regional_domain_name
  api_gateway_domain_name        = module.api_gateway.domain_name
  api_gateway_origin_path        = module.api_gateway.origin_path
  price_class                    = "PriceClass_All"
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
