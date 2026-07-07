locals {
  use_prebuilt_package = var.layer_zip_path != null
}

# Only used when no pre-built package is supplied (e.g. local/dev workflow).
# `source_dir` must be the directory that directly *contains* the `python/`
# folder (not `python/` itself), so the zip preserves "python/..." as the
# top-level path - the layout the Lambda Python runtime requires in order to
# put a layer's code on sys.path.
data "archive_file" "layer" {
  count       = local.use_prebuilt_package ? 0 : 1
  type        = "zip"
  source_dir  = var.source_dir
  output_path = "${path.module}/.build/${var.layer_name}.zip"
}

resource "aws_lambda_layer_version" "this" {
  layer_name               = var.layer_name
  description              = var.description
  compatible_runtimes      = var.compatible_runtimes
  compatible_architectures = var.compatible_architectures

  filename         = local.use_prebuilt_package ? var.layer_zip_path : data.archive_file.layer[0].output_path
  source_code_hash = local.use_prebuilt_package ? filebase64sha256(var.layer_zip_path) : data.archive_file.layer[0].output_base64sha256
}
