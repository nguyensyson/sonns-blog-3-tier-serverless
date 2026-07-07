# This bucket is private end-to-end: no static-website-hosting endpoint, no
# public ACL/policy. CloudFront reaches it exclusively via Origin Access
# Control (OAC). The bucket policy that grants CloudFront read access is
# created in the environment root module (not here), because it needs the
# CloudFront distribution ARN as its condition value and the CloudFront
# module needs this bucket's domain name as its origin — creating that
# policy inside either module would form a circular module dependency.

resource "aws_s3_bucket" "this" {
  bucket = var.bucket_name
  tags   = var.tags
}

resource "aws_s3_bucket_versioning" "this" {
  bucket = aws_s3_bucket.this.id

  versioning_configuration {
    status = var.enable_versioning ? "Enabled" : "Suspended"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "this" {
  bucket = aws_s3_bucket.this.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_public_access_block" "this" {
  bucket = aws_s3_bucket.this.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}
