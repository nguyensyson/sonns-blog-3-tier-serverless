variable "layer_name" {
  description = "Name of the Lambda Layer."
  type        = string
}

variable "description" {
  description = "Description of the layer."
  type        = string
  default     = ""
}

variable "compatible_runtimes" {
  description = "Runtimes this layer is compatible with, e.g. [\"python3.12\"]."
  type        = list(string)
  default     = ["python3.12"]
}

variable "compatible_architectures" {
  description = "Instruction set architectures this layer is compatible with."
  type        = list(string)
  default     = ["x86_64"]
}

variable "source_dir" {
  description = "Path to the directory *containing* the layer's `python/` folder (not `python/` itself). Zipped automatically via archive_file. Ignored if layer_zip_path is set. Before relying on this, run `pip install -r requirements.txt -t python/` inside that directory so third-party deps are included."
  type        = string
  default     = null
}

variable "layer_zip_path" {
  description = "Path to a pre-built .zip layer package (e.g. produced by CI/CD) already shaped with a top-level `python/` folder. Takes precedence over source_dir."
  type        = string
  default     = null
}
