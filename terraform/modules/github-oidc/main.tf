data "aws_caller_identity" "current" {}

# GitHub's OIDC token endpoint - thumbprint fetched dynamically so it never
# goes stale (AWS validates the full CA chain today, but the argument is
# still required by the provider).
data "tls_certificate" "github" {
  url = "https://token.actions.githubusercontent.com"
}

resource "aws_iam_openid_connect_provider" "github" {
  url             = "https://token.actions.githubusercontent.com"
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = [data.tls_certificate.github.certificates[0].sha1_fingerprint]

  tags = var.tags
}

locals {
  allowed_subjects = coalesce(var.allowed_subjects, ["repo:${var.github_repository}:ref:refs/heads/main"])
}

data "aws_iam_policy_document" "assume_role" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRoleWithWebIdentity"]

    principals {
      type        = "Federated"
      identifiers = [aws_iam_openid_connect_provider.github.arn]
    }

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:aud"
      values   = ["sts.amazonaws.com"]
    }

    condition {
      test     = "StringLike"
      variable = "token.actions.githubusercontent.com:sub"
      values   = local.allowed_subjects
    }
  }
}

resource "aws_iam_role" "github_actions" {
  name               = var.role_name
  assume_role_policy = data.aws_iam_policy_document.assume_role.json
  tags               = var.tags
}

# Broad but not admin: covers every AWS service this project's Terraform
# touches (Lambda, API Gateway, DynamoDB, S3, CloudFront, Route53, ACM,
# Secrets Manager, CloudWatch/SNS) without granting IAM/Organizations
# management, which PowerUserAccess explicitly excludes.
resource "aws_iam_role_policy_attachment" "power_user" {
  role       = aws_iam_role.github_actions.name
  policy_arn = "arn:aws:iam::aws:policy/PowerUserAccess"
}

# PowerUserAccess excludes IAM entirely, but Terraform must create/attach the
# Lambda execution role and the API Gateway CloudWatch role. Scoped to this
# project's name prefix only - never "*".
data "aws_iam_policy_document" "scoped_iam" {
  statement {
    sid    = "ManageProjectRoles"
    effect = "Allow"
    actions = [
      "iam:CreateRole",
      "iam:DeleteRole",
      "iam:GetRole",
      "iam:PassRole",
      "iam:PutRolePolicy",
      "iam:DeleteRolePolicy",
      "iam:GetRolePolicy",
      "iam:AttachRolePolicy",
      "iam:DetachRolePolicy",
      "iam:ListRolePolicies",
      "iam:ListAttachedRolePolicies",
      "iam:ListInstanceProfilesForRole",
      "iam:TagRole",
      "iam:UntagRole",
    ]
    resources = ["arn:aws:iam::${data.aws_caller_identity.current.account_id}:role/${var.project_name}-*"]
  }

  statement {
    sid    = "ManageProjectPolicies"
    effect = "Allow"
    actions = [
      "iam:CreatePolicy",
      "iam:DeletePolicy",
      "iam:GetPolicy",
      "iam:GetPolicyVersion",
      "iam:CreatePolicyVersion",
      "iam:DeletePolicyVersion",
      "iam:ListPolicyVersions",
      "iam:TagPolicy",
      "iam:UntagPolicy",
    ]
    resources = ["arn:aws:iam::${data.aws_caller_identity.current.account_id}:policy/${var.project_name}-*"]
  }
}

resource "aws_iam_policy" "scoped_iam" {
  name   = "${var.role_name}-scoped-iam"
  policy = data.aws_iam_policy_document.scoped_iam.json
  tags   = var.tags
}

resource "aws_iam_role_policy_attachment" "scoped_iam" {
  role       = aws_iam_role.github_actions.name
  policy_arn = aws_iam_policy.scoped_iam.arn
}
