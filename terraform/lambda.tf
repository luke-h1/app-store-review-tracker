data "archive_file" "lambda_archive" {
  type        = "zip"
  source_dir  = "${path.module}/../apps/lambda/dist"
  output_path = "${path.module}/../lambda.zip"
}

resource "aws_iam_role" "lambda_exec" {
  name = "${var.project_name}-${var.env}-exec-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Sid    = ""
      Principal = {
        Service = "lambda.amazonaws.com"
      }
      }
    ]
  })
}


resource "aws_iam_role_policy_attachment" "lambda_policy" {
  role       = aws_iam_role.lambda_exec.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy" "lambda_dynamodb" {
  name = "${var.project_name}-${var.env}-dynamodb-policy"
  role = aws_iam_role.lambda_exec.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:PutItem",
          "dynamodb:GetItem",
          "dynamodb:Query",
          "dynamodb:Scan",
          "dynamodb:UpdateItem"
        ]
        Resource = [
          aws_dynamodb_table.reviews.arn
        ]
      }
    ]
  })
}



resource "aws_lambda_function" "lambda" {
  function_name    = "${var.project_name}-lambda-${var.env}"
  runtime          = "nodejs22.x"
  handler          = "index.handler"
  role             = aws_iam_role.lambda_exec.arn
  filename         = "${path.module}/../lambda.zip"
  source_code_hash = data.archive_file.lambda_archive.output_base64sha256
  timeout          = 10

  description   = "${var.project_name}-lambda-${var.env}"
  memory_size   = 256
  architectures = ["arm64"]
  environment {
    variables = {
      DEPLOYED_AT        = timestamp()
      DEPLOYED_BY        = var.deployed_by
      GIT_SHA            = var.git_sha
      REVIEWS_TABLE_NAME = aws_dynamodb_table.reviews.name
      AWS_REGION         = "eu-west-2"
      APPLE_APP_IDS      = join(",", var.apple_app_ids)
      GOOGLE_APP_IDS     = join(",", var.google_app_ids)
      APPLE_COUNTRY      = var.apple_country
      REVIEW_LIMIT       = var.review_limit
      SLACK_WEBHOOK_URLS = join(",", var.slack_webhook_urls)
      COUNTRY            = var.apple_country
    }
  }
  tags = merge(var.tags, {
    Environment = var.env,
  })
}

resource "aws_cloudwatch_log_group" "lambda_logs" {
  name              = "/aws/lambda/${aws_lambda_function.lambda.function_name}"
  retention_in_days = 1
  log_group_class   = "STANDARD"

  tags = {
    Environment = var.env
    Service     = var.project_name
    s3export    = "true"
  }
}
