# Bootstrap

Creates the remote state backend used by every environment:

- S3 bucket — stores `terraform.tfstate`, versioned + encrypted (SSE-S3) + fully blocked from public access.
- DynamoDB table — state lock table (`LockID` partition key, `PAY_PER_REQUEST`).

This is the **only** part of this repository that uses a local backend, because
the remote backend does not exist until this step has run once.

## Usage

```bash
cd terraform/bootstrap
cp terraform.tfvars.example terraform.tfvars
# edit terraform.tfvars: set a globally-unique state_bucket_name

terraform init
terraform plan
terraform apply
```

## After apply

Copy the outputs into `environments/<env>/backend.tf`:

```bash
terraform output
```

- `state_bucket_name`  -> `bucket` in backend.tf
- `lock_table_name`    -> `dynamodb_table` in backend.tf
- `aws_region`         -> `region` in backend.tf

Each environment uses a different `key` (e.g. `dev/terraform.tfstate`,
`prod/terraform.tfstate`) inside the **same** bucket, so state stays isolated
per environment while the backend infrastructure is only created once.

## Notes

- `terraform.tfstate` for the bootstrap itself stays local. Keep
  `terraform/bootstrap/terraform.tfstate*` out of git (already covered by the
  repo's `.gitignore`) or, if you prefer, move it to a separate secured
  location after the first successful apply since it is rarely re-run.
- Both resources have `prevent_destroy = true` — running `terraform destroy`
  here will not accidentally delete state history for dev/prod.
- Re-run bootstrap only when you need to change the backend infrastructure
  itself (e.g. rotating the lock table). Routine work happens in
  `environments/dev` or `environments/prod`.
