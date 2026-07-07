# Fill these in from `terraform output` in terraform/bootstrap after running
# it once. Backend blocks cannot reference variables, so the values must be
# literal. The `key` is unique to this environment so dev and prod state
# never collide inside the same bucket.
terraform {
  backend "s3" {
    bucket         = "REPLACE_WITH_BOOTSTRAP_state_bucket_name"
    key            = "prod/terraform.tfstate"
    region         = "REPLACE_WITH_BOOTSTRAP_aws_region"
    dynamodb_table = "REPLACE_WITH_BOOTSTRAP_lock_table_name"
    encrypt        = true
  }
}
