# Terraform — 3-Tier Serverless Infrastructure

Infrastructure as Code for the blog's 3-tier architecture on AWS:

- **Tier 1 - Presentation**: Route 53, ACM, CloudFront, S3 (frontend, private + OAC)
- **Tier 2 - Application**: API Gateway, Lambda
- **Tier 3 - Data**: DynamoDB, Secrets Manager, S3 (images, private)
- **Monitoring**: CloudWatch log groups, metric alarms, SNS notifications

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

Keep the four outputs handy: `state_bucket_name`, `lock_table_name`, `aws_region`.

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
- Lambda's IAM role is scoped to the specific DynamoDB table, S3 images bucket, and Secrets Manager secret created by that same environment — no wildcards.
- Secrets Manager secrets are created with a placeholder value only; set the real value afterwards via console/CLI/CI-CD, never in `.tf`/`.tfvars`.

## Key variables to fill in before the first `apply`

Per environment, in `terraform.tfvars`:

- `project_name`, `owner`, `cost_center` — identity/tagging
- `aws_region` — where regional resources live
- `root_domain_name`, `site_domain_name`, `create_route53_zone` — DNS/TLS
- `lambda_source_dir` — path to the backend Lambda code to package
- `alarm_email` — where CloudWatch alarm notifications go (optional but recommended for prod)

See each environment's `terraform.tfvars.example` for the full list with
sane defaults already filled in for the rest.
