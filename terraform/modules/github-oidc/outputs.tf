output "role_arn" {
  description = "ARN of the IAM role GitHub Actions assumes via OIDC. Set as the AWS_GITHUB_ACTIONS_ROLE_ARN repo variable."
  value       = aws_iam_role.github_actions.arn
}

output "oidc_provider_arn" {
  value = aws_iam_openid_connect_provider.github.arn
}
