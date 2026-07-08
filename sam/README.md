# SAM — Serverless compute tier

AWS SAM project for the Lambda + API Gateway half of `sonns-blogs`, migrated
out of Terraform (`terraform/modules/lambda`, `lambda-layer`, `api-gateway`,
and the Lambda/API-Gateway half of `cloudwatch` — all deleted). See
`terraform/README.md` "Serverless migration" for the history and the exact
`terraform state rm` commands that were run to make this split safely.

## Ownership boundary

| Owns | Where |
|---|---|
| 3 Lambda functions (`user`, `posts`, `tasks`), shared Layer, REST API, per-function IAM roles, Lambda/API Gateway log groups + alarms | **SAM** (this directory) |
| DynamoDB (4 tables), S3 (images + frontend), Secrets Manager, CloudFront, ACM, Route53, GitHub OIDC, account-level API Gateway CloudWatch role | **Terraform** (`../terraform`) |

The Lambda application code itself is **not** duplicated here — `template.yaml`
points `CodeUri`/`ContentUri` straight at `../backend/modules/<name>` and
`../backend/layers/common`. See `functions/README.md` and `layers/README.md`.

## Directory layout

```
sam/
├── template.yaml         # root template: 3 functions, shared layer, REST API, alarms
├── samconfig.toml        # defaults for local commands (sam build, sam local)
├── env/
│   ├── dev.toml          # sam deploy --config-file env/dev.toml  --config-env dev
│   └── prod.toml         # sam deploy --config-file env/prod.toml --config-env prod
├── api/
│   └── openapi.yaml      # REST API route definitions (imported via DefinitionUri)
├── functions/            # pointers to backend/modules/<domain> (no code duplication)
├── layers/               # pointer to backend/layers/common
├── events/
│   └── health-event.json # sample event for `sam local invoke`
├── scripts/
│   └── publish-api-domain.sh   # writes SAM's API domain to SSM for Terraform's CloudFront
└── tests/                # pointer to backend/tests (pytest + moto, unchanged)
```

## Cross-stack references

Terraform and SAM are two separate deployments that both need values the
other side owns. There's no CloudFormation/Terraform native bridge, so both
directions go through **SSM Parameter Store**, named `/<project>-<stage>/...`:

**Terraform → SAM** (forward — table/bucket/secret names & ARNs):
`terraform/environments/<stage>/main.tf` writes these as plain
`aws_ssm_parameter` resources. `env/<stage>.toml`'s `parameter_overrides`
reads them back with SAM's native `{{resolve:ssm:...}}` dynamic reference
syntax — CloudFormation resolves them at deploy time, no manual copy/paste.

**SAM → Terraform** (reverse — API Gateway's regional domain name):
CloudFront (still in Terraform) needs to use the API as an origin, but the
API is created by SAM, so its domain name (which embeds a
CloudFormation-generated API ID) isn't known to Terraform ahead of time.
Terraform creates the SSM parameter `/…/apigateway/domain-name` once with a
placeholder value and `lifecycle { ignore_changes = [value] }`, so it never
fights over ownership with SAM. After every `sam deploy`,
`scripts/publish-api-domain.sh` reads the stack's `ApiDomainName` output and
overwrites that parameter with a plain `aws ssm put-parameter` call —
deliberately outside both Terraform's and CloudFormation's state.

This makes the deploy order **Terraform → SAM → Terraform**:

1. `terraform apply` — creates/updates DynamoDB, S3, Secrets Manager, and
   the forward SSM parameters. CloudFront's origin still points at whatever
   it was last set to (or the bootstrap placeholder, on a brand-new
   environment — expect CloudFront to be broken until step 3 on first setup).
2. `sam build && sam deploy` — reads the forward SSM parameters, creates/
   updates the 3 functions + API, then `publish-api-domain.sh` writes the
   real API domain back to SSM.
3. `terraform apply` again — picks up the real API domain and updates
   CloudFront's origin. A no-op most of the time, since the API's domain
   name doesn't change between ordinary deploys (only if the `Api` resource
   were ever replaced).

`.github/workflows/backend-deploy.yml` runs exactly this sequence for prod.

The stage name is always `dev` or `prod` and is passed straight through as
both the SAM `Stage` parameter and the API Gateway stage name, so
`api_gateway_origin_path` in Terraform (`"/${var.environment}"`) never needs
its own round-trip through SSM.

## Deploying

```bash
cd sam
sam build                                                   # --use-container comes from samconfig.toml
sam deploy --config-file env/dev.toml  --config-env dev     # or env/prod.toml --config-env prod
```

Both `env/dev.toml` and `env/prod.toml` set `resolve_s3 = true`, so SAM
manages its own deployment-artifacts bucket automatically — no bucket to
provision by hand.

**Migrate dev first, verify, then prod** — see "Local development" below to
exercise the API before deploying, and re-run the pytest suite
(`../backend/tests/`) against dev after deploying before touching prod.

## Local development

```bash
cd sam
sam build
sam local start-api --config-file env/dev.toml --config-env dev
# in another terminal:
curl http://127.0.0.1:3000/auth/register -X POST -H 'Content-Type: application/json' \
  -d '{"email":"a@test.com","password":"secret123","displayName":"A"}'
```

Or invoke a single function directly (faster iteration, no API Gateway
emulation):

```bash
sam local invoke UserFunction --config-file env/dev.toml --config-env dev \
  --event events/health-event.json
```

Local runs still need real AWS credentials for DynamoDB/S3/Secrets Manager
unless you point `AWS_ENDPOINT_URL` at a local DynamoDB/localstack — the
pytest suite in `../backend/tests` (moto-mocked, no AWS needed) is the faster
loop for day-to-day changes; use `sam local` to sanity-check the actual
packaged Lambda + API Gateway wiring before deploying.

## Rollback

`sam deploy` deploys via a CloudFormation changeset — if any resource fails
to create/update, CloudFormation automatically rolls the stack back to its
last good state on its own; nothing extra to run. CI
(`.github/workflows/backend-deploy.yml`) additionally prints the failed
resources' `StackEvents` (`describe-stack-events` filtered to `*_FAILED`) so
the cause is visible in the workflow log without needing console access.

To roll back a *bad but successfully deployed* release, redeploy the
previous commit (`sam build && sam deploy ...` from that revision) — SAM/
CloudFormation has no separate "rollback to previous release" command, it
only auto-rolls-back a failed *in-progress* deployment.

## Naming constraint (don't rename the stack)

The GitHub Actions deploy role's IAM permissions are scoped to
`arn:aws:iam::<account>:role/<project_name>-*` (see
`terraform/modules/github-oidc`). CloudFormation names SAM's
auto-generated per-function IAM roles after the **stack name**
(`sonns-blogs-<stage>-backend-UserFunctionRole-XXXX`), so as long as
`stack_name` in `env/<stage>.toml` keeps the `<project_name>-<stage>-*`
prefix, no changes to the Terraform-managed CI role are needed. Renaming the
stack to something that doesn't start with the project name will break CI's
permission to deploy.
