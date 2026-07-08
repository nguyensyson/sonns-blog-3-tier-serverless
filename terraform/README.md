# Terraform — Platform Infrastructure

Infrastructure as Code for the blog's platform/data tier on AWS. The
serverless compute tier (Lambda + API Gateway) moved to **AWS SAM** — see
`../sam/README.md`. This directory now owns:

- **Tier 1 - Presentation**: Route 53, ACM, CloudFront, S3 (frontend, private + OAC)
- **Tier 3 - Data**: 4 DynamoDB tables (`Users`, `Posts`, `Groups`, `Tasks` — see
  `backend/shared/dynamodb-schema.md`), Secrets Manager, S3 (images, private)
- **IAM**: only the account-level API Gateway CloudWatch logging role
  (a singleton, unrelated to any one API) — everything Lambda-specific
  (execution roles, log groups, alarms) moved to SAM.

See "Serverless migration" below for what moved, why, and how the two sides
now reference each other.

## What's here

`environments/<env>/main.tf` wires up:

- `module.dynamodb_users` / `dynamodb_posts` / `dynamodb_groups` / `dynamodb_tasks` —
  4 calls to the generic `dynamodb` module, each with its own hash key and GSIs.
- `module.secrets_manager`, `module.s3_images_bucket` — the JWT secret and the
  images bucket, both read by SAM's Lambda functions via SSM (see below).
- `module.iam` — the account-level API Gateway CloudWatch logging role only.
- `module.route53_zone`/`acm`/`s3_static_website`/`cloudfront`/`route53_records` —
  the frontend's presentation tier, unchanged. `module.cloudfront`'s API
  origin now comes from an SSM parameter instead of a same-state module
  output (SAM owns the API Gateway that used to live in `module.api_gateway`)
  — see "Serverless migration" below.

## Serverless migration (Terraform → SAM)

The 3 Lambda functions (`user`, `posts`, `tasks`), their shared Layer, the
REST API, their IAM execution roles, and their CloudWatch log
groups/alarms used to live in `terraform/modules/lambda`, `lambda-layer`,
`api-gateway`, and (partially) `iam`/`cloudwatch`. They now live in
`../sam/template.yaml` instead, for least-privilege per-function IAM roles
and `sam build`/`sam deploy` in CI instead of `terraform apply`.

**What moved out**: `aws_lambda_function` ×3, `aws_lambda_layer_version`,
`aws_lambda_permission`, all `aws_api_gateway_*` resources, the Lambda
execution role + its 2 policies (`modules/iam`), and the Lambda/API-Gateway
CloudWatch log groups + metric alarms + SNS topics (`modules/cloudwatch`).
The `modules/lambda`, `modules/lambda-layer`, `modules/api-gateway`, and
`modules/cloudwatch` directories were deleted entirely.

**What stayed**: everything not serverless-specific (DynamoDB, S3, Secrets
Manager, CloudFront, ACM, Route53, GitHub OIDC) plus the account-level API
Gateway CloudWatch role singleton (`modules/iam`, now much smaller).

**How the two sides reference each other now** — see `../sam/README.md`
"Cross-stack references" for the full explanation; in short:

- Terraform → SAM: `aws_ssm_parameter` resources here publish table/bucket/
  secret names+ARNs; SAM reads them via `{{resolve:ssm:...}}` in
  `sam/env/<stage>.toml`.
- SAM → Terraform: `module.cloudfront`'s `api_gateway_domain_name` now comes
  from `data.aws_ssm_parameter.api_gateway_domain_name`, a parameter this
  Terraform config creates once (placeholder value, `ignore_changes`) and
  `sam/scripts/publish-api-domain.sh` overwrites after every `sam deploy`.

**How to clean up state for each environment (dev first, then prod — not run
yet, do this by hand):** the code for the serverless resources is already
gone from this repo, so `terraform plan` in an environment that hasn't had
its state cleaned up yet will show these as pending *deletes*. Do **not**
run `terraform apply` in that state — it would delete the running Lambda
functions and API Gateway. Instead, remove them from state first with
`terraform state rm` (this only forgets the resource in Terraform's
bookkeeping; it does not call any AWS delete API, so the real
functions/API/roles keep running untouched):

```bash
cd terraform/environments/dev   # then repeat for prod once dev is verified

terraform state rm module.lambda_layer_common.aws_lambda_layer_version.this
terraform state rm module.lambda_user.aws_lambda_function.this
terraform state rm module.lambda_posts.aws_lambda_function.this
terraform state rm module.lambda_tasks.aws_lambda_function.this
terraform state rm module.api_gateway            # removes every resource under this module in one go
terraform state rm module.cloudwatch_user
terraform state rm module.cloudwatch_posts
terraform state rm module.cloudwatch_tasks
terraform state rm module.cloudwatch_api
terraform state rm module.iam.aws_iam_role.lambda_execution
terraform state rm module.iam.aws_iam_policy.lambda_logging
terraform state rm module.iam.aws_iam_role_policy_attachment.lambda_logging
terraform state rm module.iam.aws_iam_policy.lambda_data_access
terraform state rm module.iam.aws_iam_role_policy_attachment.lambda_data_access

terraform plan   # must come back clean (only the new aws_ssm_parameter resources to add)
```

Then decide how the *real* AWS resources get cut over to SAM:

- **dev** (recommended path, accepts a short-lived break): just run
  `sam deploy`. CloudFormation creates a brand-new REST API (new API ID) and
  new Lambda functions under the `sonns-blogs-dev-*` names. The old
  Terraform-created ones become orphaned (no longer managed by anything) —
  delete them by hand from the console/CLI once the new stack is verified
  working (`aws lambda delete-function`, `aws apigateway delete-rest-api`
  for the old, pre-migration ones only).
- **prod**: verify the exact same steps on `dev` first. Then either accept
  the same short cutover window (simplest, fine for low-traffic APIs behind
  CloudFront — clients briefly 5xx while the new API deploys, then recover
  once `terraform apply` in step 3 repoints CloudFront's origin) or plan a
  blue/green cutover (deploy the SAM stack, verify its API directly via its
  own execute-api URL, only then let the CloudFront `terraform apply`
  repoint traffic to it) if even a brief interruption isn't acceptable.

## Directory layout

```
terraform/
├── bootstrap/        # run once, before anything else - creates the remote state backend
├── modules/           # reusable building blocks, no provider/backend config, no hardcoded values
└── environments/
    ├── dev/
    └── prod/
```

## Deployment order

### 1. Bootstrap (once, ever)

```bash
cd terraform/bootstrap
cp terraform.tfvars.example terraform.tfvars   # edit state_bucket_name to something globally unique
terraform init
terraform plan
terraform apply
terraform output
```

Keep the outputs handy: `state_bucket_name`, `lock_table_name`, `aws_region`,
`github_actions_role_arn`.

Bootstrap also creates the GitHub OIDC provider + IAM role
(`modules/github-oidc`) that the CI/CD workflows in `.github/workflows/`
assume instead of using static AWS access keys. To wire it up:

1. Set `github_repository` in `terraform/bootstrap/terraform.tfvars` to
   `"<owner>/<repo>"`.
2. After `terraform apply`, copy the `github_actions_role_arn` output into
   the repo's **Settings → Secrets and variables → Actions → Variables** as
   `AWS_GITHUB_ACTIONS_ROLE_ARN`.
3. Also add `AWS_REGION` and `PROJECT_NAME` as (non-secret) repo variables —
   both workflows need them (`PROJECT_NAME` only to name/locate the SAM
   stack and its SSM parameters).

`terraform apply` itself is **not** run by CI (see "Serverless migration"
above) — only a dev runs it, from `terraform.tfvars` on their machine (step 3
below). So the rest of `terraform.tfvars.example`'s values (`OWNER`,
`COST_CENTER`, `ROOT_DOMAIN_NAME`, `SITE_DOMAIN_NAME`, etc.) don't need to be
repo variables at all.

By default the role only trusts `workflow_dispatch`/push-triggered runs on
`main` (see `github-oidc`'s `allowed_subjects`), and its IAM permissions are
`PowerUserAccess` (everything except IAM/Organizations) plus a scoped policy
letting it manage only `<project_name>-*` IAM roles/policies — enough to
create/attach the account-level API Gateway CloudWatch role, and (since
CloudFormation names SAM's auto-generated per-function roles after the stack
name, e.g. `sonns-blogs-prod-backend-UserFunctionRole-XXXX`) SAM's Lambda
execution roles too, as long as `sam/env/<stage>.toml`'s `stack_name` keeps
the `<project_name>-<stage>-*` prefix — see `../sam/README.md` "Naming
constraint".

### 2. Wire up an environment's backend

Edit `environments/<env>/backend.tf` and replace the `REPLACE_WITH_BOOTSTRAP_*`
placeholders with the bootstrap outputs. `dev` and `prod` use the **same**
bucket/table but different `key` values (`dev/terraform.tfstate` vs
`prod/terraform.tfstate`), so their state never mixes while only one backend
needs to be provisioned. If you'd rather isolate them further (e.g. separate
AWS accounts), point each environment's `bucket` at its own bucket instead —
the module/environment code doesn't change either way.

### 3. Deploy an environment

```bash
cd terraform/environments/dev      # or prod
cp terraform.tfvars.example terraform.tfvars   # fill in real values - never commit this file
terraform init
terraform plan
terraform apply
```

Each environment is fully independent: separate state, separate `terraform
init/plan/apply` invocations, separate variable values.

## Cross-environment coupling to be aware of

Two settings are **account/region-wide singletons**, not per-environment.
If dev and prod deploy into the same AWS account and region, only enable
each in ONE of the two environments (the tfvars.example files default to
dev owning both — flip if you'd rather prod own them):

| Setting | Variable | Why it's shared |
|---|---|---|
| Route 53 hosted zone for the root domain | `create_route53_zone` | Only one zone should exist per domain; the other environment sets `create_route53_zone = false` and reuses it via a delegated/sub- domain record |
| API Gateway → CloudWatch Logs role | `manage_apigateway_account_settings` | `aws_api_gateway_account` is one setting per AWS account+region, not per API |

## Tagging

Every environment sets `default_tags` on the `aws` provider (`providers.tf`)
so `Project`, `Environment`, `ManagedBy`, `Owner`, and (optionally)
`CostCenter` land on every taggable resource automatically. Resources that
don't support `default_tags` receive the same values explicitly via the
`tags` variable threaded down from each environment's `local.common_tags`
into every module call.

## Security notes

- `terraform.tfvars`, `*.tfstate`, and `.terraform/` are gitignored repo-wide. Only `terraform.tfvars.example` is committed.
- Both S3 buckets (frontend, images) and the bootstrap state bucket: versioned, encrypted, all public access blocked.
- The frontend bucket has no public policy and no static-website-hosting endpoint — CloudFront reaches it exclusively via Origin Access Control (OAC). The bucket policy granting that access lives in each environment's `main.tf` root (not inside a module) because it needs both the bucket ARN and the CloudFront distribution ARN, and putting it in either module would create a circular module dependency.
- Lambda's IAM roles (one per function, least-privilege) are now defined in `../sam/template.yaml`, scoped to only the table/bucket/secret each function actually uses — see `../sam/README.md`.
- Secrets Manager secrets are created with a placeholder value only; set the real value afterwards via console/CLI/CI-CD, never in `.tf`/`.tfvars`.

## Key variables to fill in before the first `apply`

Per environment, in `terraform.tfvars`:

- `project_name`, `owner`, `cost_center` — identity/tagging
- `aws_region` — where regional resources live
- `root_domain_name`, `site_domain_name`, `create_route53_zone` — DNS/TLS
- `dynamodb_billing_mode`, `secret_description` — data tier
- `manage_apigateway_account_settings` — see "Cross-environment coupling" above

See each environment's `terraform.tfvars.example` for the full list with
sane defaults already filled in for the rest. Lambda/API Gateway
configuration (memory, timeout, CORS origins, log retention, alarm email) now
lives in `../sam/env/<stage>.toml` instead.
