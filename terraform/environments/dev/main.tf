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

  users_table_name  = "${local.name_prefix}-users"
  posts_table_name  = "${local.name_prefix}-posts"
  groups_table_name = "${local.name_prefix}-groups"
  tasks_table_name  = "${local.name_prefix}-tasks"

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
# Only the account-level API Gateway CloudWatch logging role lives here now.
# The 3 Lambda execution roles (least-privilege, one per function) moved to
# the SAM template (see sam/template.yaml) along with the functions
# themselves - see sam/README.md and terraform/README.md "Serverless
# migration" section for the full rationale.

module "iam" {
  source = "../../modules/iam"

  name_prefix                        = local.name_prefix
  manage_apigateway_account_settings = var.manage_apigateway_account_settings
  tags                               = local.common_tags
}

# --- SSM bridge (Terraform -> SAM) ---
# The Lambda functions (now in SAM) need the names/ARNs of these
# Terraform-managed resources. SAM reads them at deploy time via native
# {{resolve:ssm:...}} dynamic references in env/<stage>.toml - see
# sam/README.md "Cross-stack references".

resource "aws_ssm_parameter" "users_table_name" {
  name  = "/${local.name_prefix}/dynamodb/users-table-name"
  type  = "String"
  value = module.dynamodb_users.table_name
  tags  = local.common_tags
}

resource "aws_ssm_parameter" "posts_table_name" {
  name  = "/${local.name_prefix}/dynamodb/posts-table-name"
  type  = "String"
  value = module.dynamodb_posts.table_name
  tags  = local.common_tags
}

resource "aws_ssm_parameter" "groups_table_name" {
  name  = "/${local.name_prefix}/dynamodb/groups-table-name"
  type  = "String"
  value = module.dynamodb_groups.table_name
  tags  = local.common_tags
}

resource "aws_ssm_parameter" "tasks_table_name" {
  name  = "/${local.name_prefix}/dynamodb/tasks-table-name"
  type  = "String"
  value = module.dynamodb_tasks.table_name
  tags  = local.common_tags
}

resource "aws_ssm_parameter" "images_bucket_name" {
  name  = "/${local.name_prefix}/s3/images-bucket-name"
  type  = "String"
  value = module.s3_images_bucket.bucket_id
  tags  = local.common_tags
}

resource "aws_ssm_parameter" "app_secret_name" {
  name  = "/${local.name_prefix}/secrets/app-secret-name"
  type  = "String"
  value = module.secrets_manager.secret_name
  tags  = local.common_tags
}

resource "aws_ssm_parameter" "app_secret_arn" {
  name  = "/${local.name_prefix}/secrets/app-secret-arn"
  type  = "String"
  value = module.secrets_manager.secret_arn
  tags  = local.common_tags
}

# --- SSM bridge (SAM -> Terraform) ---
# CloudFront (below) needs the API Gateway's regional domain name, which only
# exists once SAM has deployed the REST API - Terraform can't know it ahead
# of time. Terraform creates this parameter once with a placeholder value and
# then ignores further drift on it; `sam/scripts/publish-api-domain.sh` (run
# in CI right after `sam deploy`) overwrites it with the real value via a
# plain `aws ssm put-parameter` call - deliberately outside both Terraform's
# and CloudFormation's state, so there's no ownership conflict. See
# sam/README.md "Cross-stack references" for the full two-phase apply order.

resource "aws_ssm_parameter" "api_gateway_domain_name" {
  name  = "/${local.name_prefix}/apigateway/domain-name"
  type  = "String"
  # Must be syntactically a valid domain name (dots, hostname chars) - it's
  # used as a CloudFront origin's domain_name at creation time on a brand-new
  # environment, and CloudFront rejects non-domain-shaped values outright.
  # ".invalid" is the RFC 2606 TLD reserved for obviously-fake hostnames.
  value = "placeholder-until-first-sam-deploy.invalid"
  tags  = local.common_tags

  lifecycle {
    ignore_changes = [value]
  }
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

# API Gateway now lives in the SAM stack. Its regional domain name is only
# known after `sam deploy` has run at least once - see the "SSM bridge (SAM ->
# Terraform)" section above. The origin path is just "/<stage>", and the SAM
# stage name is always set equal to var.environment (see sam/template.yaml),
# so it doesn't need to round-trip through SSM.
data "aws_ssm_parameter" "api_gateway_domain_name" {
  name       = aws_ssm_parameter.api_gateway_domain_name.name
  depends_on = [aws_ssm_parameter.api_gateway_domain_name]
}

module "cloudfront" {
  source = "../../modules/cloudfront"

  name_prefix                    = local.name_prefix
  aliases                        = [var.site_domain_name]
  certificate_arn                = module.acm.certificate_arn
  s3_bucket_regional_domain_name = module.s3_static_website.bucket_regional_domain_name
  api_gateway_domain_name        = data.aws_ssm_parameter.api_gateway_domain_name.value
  api_gateway_origin_path        = "/${var.environment}"
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
