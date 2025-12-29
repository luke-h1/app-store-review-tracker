# Main rule that processes review checks
resource "aws_cloudwatch_event_rule" "hourly_review_check" {
  name                = "${var.project_name}-${var.env}-hourly-review-check"
  description         = "Trigger review check every hour"
  schedule_expression = "rate(1 hour)"
}

resource "aws_cloudwatch_event_target" "lambda_review_check" {
  rule      = aws_cloudwatch_event_rule.hourly_review_check.name
  target_id = "ReviewCheckTarget"
  arn       = aws_lambda_function.lambda.arn

  # Config can be passed via event detail or environment variables
  input = jsonencode({
    appleAppIds      = var.apple_app_ids
    googleAppIds     = var.google_app_ids
    slackWebhookUrls = var.slack_webhook_urls
    country          = var.apple_country
    limit            = var.review_limit
    sortBy           = "mostRecent"
  })
}

resource "aws_lambda_permission" "allow_eventbridge" {
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.lambda.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.hourly_review_check.arn
}

# Example: Rule for a specific subscription (can be created dynamically via API)
# This shows how to pass subscription details via EventBridge
# resource "aws_cloudwatch_event_rule" "subscription_specific" {
#   name                = "${var.project_name}-${var.env}-subscription-{subscription-id}"
#   description         = "Trigger review check for specific subscription"
#   schedule_expression = "rate(1 hour)"
# }
#
# resource "aws_cloudwatch_event_target" "subscription_specific_target" {
#   rule      = aws_cloudwatch_event_rule.subscription_specific.name
#   target_id = "SubscriptionTarget"
#   arn       = aws_lambda_function.lambda.arn
#
#   input_transformer {
#     input_template = jsonencode({
#       subscriptionId = "<subscription-id>"
#       appleAppId     = "<apple-app-id>"
#       googleAppId    = "<google-app-id>"
#       country        = "<country>"
#       limit          = <limit>
#       sortBy         = "<sort-by>"
#       slackWebhookUrl = "<webhook-url>"
#     })
#   }
# }

