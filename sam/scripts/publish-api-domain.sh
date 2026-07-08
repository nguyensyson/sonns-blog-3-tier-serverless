#!/usr/bin/env bash
# Runs right after `sam deploy` in CI. Reads the API Gateway regional domain
# name from the just-deployed CloudFormation stack's outputs and writes it to
# the SSM parameter Terraform's CloudFront module reads as its API origin
# (terraform/environments/<stage>/main.tf, "SSM bridge (SAM -> Terraform)").
#
# Deliberately a plain `aws ssm put-parameter` call, NOT a CloudFormation
# resource - the parameter is created/owned by Terraform (with a placeholder
# value + lifecycle.ignore_changes), so writing to it via the API instead of
# via a stack resource avoids both sides fighting over ownership.
#
# Usage: publish-api-domain.sh <project_name> <stage> <stack_name> [region]

set -euo pipefail

project_name="${1:?usage: publish-api-domain.sh <project_name> <stage> <stack_name> [region]}"
stage="${2:?usage: publish-api-domain.sh <project_name> <stage> <stack_name> [region]}"
stack_name="${3:?usage: publish-api-domain.sh <project_name> <stage> <stack_name> [region]}"
region="${4:-ap-southeast-1}"

domain_name=$(aws cloudformation describe-stacks \
  --stack-name "$stack_name" \
  --region "$region" \
  --query "Stacks[0].Outputs[?OutputKey=='ApiDomainName'].OutputValue" \
  --output text)

if [ -z "$domain_name" ] || [ "$domain_name" = "None" ]; then
  echo "Could not read ApiDomainName output from stack $stack_name" >&2
  exit 1
fi

param_name="/${project_name}-${stage}/apigateway/domain-name"

aws ssm put-parameter \
  --region "$region" \
  --name "$param_name" \
  --value "$domain_name" \
  --type String \
  --overwrite

echo "Published $param_name = $domain_name"
