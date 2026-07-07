# Fill these in from `terraform output` in terraform/bootstrap after running
# it once. Backend blocks cannot reference variables, so the values must be
# literal. The `key` is unique to this environment so dev and prod state
# never collide inside the same bucket.
terraform {
  backend "s3" {
    bucket         = "sonns-blogs-terraform-state-650251726830"
    key            = "dev/terraform.tfstate"
    region         = "ap-southeast-1"
    dynamodb_table = "sonns-blogs-terraform-locks"
    encrypt        = true
  }
}
