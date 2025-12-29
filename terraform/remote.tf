data "terraform_remote_state" "vpc" {
  backend   = "s3"
  workspace = var.env
  config = {
    bucket         = "${var.project_name}-${var.env}-terraform-state"
    key            = "vpc/${var.env}.tfstate"
    region         = "eu-west-2"
    dynamodb_table = "${var.project_name}-${var.env}-terraform-state-lock"
    encrypt        = true
  }
}
