resource "aws_dynamodb_table" "dynamodb_terraform_lock" {
  name         = "${var.project_name}-${var.env}-terraform-state-lock"
  hash_key     = "LockID"
  billing_mode = "PAY_PER_REQUEST"
  attribute {
    name = "LockID"
    type = "S"
  }

  tags = merge(var.tags, {
    Name = "${var.project_name}-${var.env}-terraform-state-lock"
  })
}

resource "aws_dynamodb_table" "reviews" {
  name         = "${var.project_name}-${var.env}-reviews"
  hash_key     = "reviewId"
  billing_mode = "PAY_PER_REQUEST"

  attribute {
    name = "reviewId"
    type = "S"
  }

  ttl {
    attribute_name = "ttl"
    enabled        = true
  }

  tags = merge(var.tags, {
    Name = "${var.project_name}-${var.env}-reviews"
  })
}

