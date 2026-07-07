locals {
  # AWS managed policy IDs (same in every account/region).
  caching_optimized_policy_id      = "658327ea-f89d-4fab-a63d-7e88639e58f6" # Managed-CachingOptimized
  caching_disabled_policy_id       = "4135ea2d-6df8-44a3-9df3-4b5a84be39ad" # Managed-CachingDisabled
  all_viewer_except_host_policy_id = "b689b0a8-53d0-40ab-baf2-68738e2966ac" # Managed-AllViewerExceptHostHeader
}

resource "aws_cloudfront_origin_access_control" "s3" {
  name                              = "${var.s3_origin_id}-oac"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

resource "aws_cloudfront_distribution" "this" {
  enabled             = true
  is_ipv6_enabled     = true
  comment             = "Frontend + /api proxy distribution"
  default_root_object = var.default_root_object
  aliases             = var.aliases
  price_class         = var.price_class
  tags                = var.tags

  origin {
    domain_name              = var.s3_bucket_regional_domain_name
    origin_id                = var.s3_origin_id
    origin_access_control_id = aws_cloudfront_origin_access_control.s3.id
  }

  origin {
    domain_name = var.api_gateway_domain_name
    origin_id   = var.api_origin_id
    origin_path = var.api_gateway_origin_path

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  default_cache_behavior {
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = var.s3_origin_id
    viewer_protocol_policy = "redirect-to-https"
    compress               = true
    cache_policy_id        = local.caching_optimized_policy_id
  }

  ordered_cache_behavior {
    path_pattern             = var.api_path_pattern
    allowed_methods          = ["GET", "HEAD", "OPTIONS", "PUT", "POST", "PATCH", "DELETE"]
    cached_methods           = ["GET", "HEAD"]
    target_origin_id         = var.api_origin_id
    viewer_protocol_policy   = "https-only"
    compress                 = true
    cache_policy_id          = local.caching_disabled_policy_id
    origin_request_policy_id = local.all_viewer_except_host_policy_id
  }

  # SPA routing (BrowserRouter): unknown paths 403/404 from S3 fall back to
  # index.html with a 200 so client-side routing can take over.
  custom_error_response {
    error_code         = 403
    response_code      = 200
    response_page_path = "/index.html"
  }

  custom_error_response {
    error_code         = 404
    response_code      = 200
    response_page_path = "/index.html"
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    acm_certificate_arn      = var.certificate_arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }
}
