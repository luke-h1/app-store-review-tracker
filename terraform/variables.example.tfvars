# Example Terraform Variables
# Copy this file to your environment-specific tfvars file (e.g., terraform/envs/production.tfvars)
# and fill in the actual values. Do not commit actual values to version control.

# Required: The environment to deploy to
env = "production"

# Required: The zone id for the route53 record
zone_id = "Z1234567890ABC"

# The root domain for the route53 record
root_domain = "my-domain.com"

# Required: The private key for the certificate
private_key = <<-EOT
-----BEGIN PRIVATE KEY-----
YOUR_PRIVATE_KEY_HERE
-----END PRIVATE KEY-----
EOT

# Required: The certificate body for the certificate
certificate_body = <<-EOT
-----BEGIN CERTIFICATE-----
YOUR_CERTIFICATE_BODY_HERE
-----END CERTIFICATE-----
EOT

# Required: The certificate chain for the certificate
certificate_chain = <<-EOT
-----BEGIN CERTIFICATE-----
YOUR_CERTIFICATE_CHAIN_HERE
-----END CERTIFICATE-----
EOT

# Optional: The tags to apply to the resources (default: Service=AppStoreReviewerTracker, ManagedBy=Terraform)
tags = {
  "Service"   = "AppStoreReviewerTracker"
  "ManagedBy" = "Terraform"
}

# Optional: The git sha that triggered the deployment (default: "change-me")
git_sha = "change-me"

# Optional: Who initiated the deployment? 
deployed_by = "your-git-user"

# Optional: Name of the project (default: "appstore-review-tracker")
project_name = "appstore-review-tracker"

# Required: The API key to set on the authorizer (sensitive)
api_key = "your-api-key-here"

# Optional: List of Apple App Store app IDs (default: [])
apple_app_ids = [
  # "1345907668",
  # "6740410176",
]

# Optional: List of Google Play Store app IDs (default: [])
google_app_ids = [
  # "com.example.app",
]

# Optional: Country code for Apple App Store reviews (default: "gb")
apple_country = "gb"

# Optional: Maximum number of reviews to fetch per check (default: "10")
review_limit = "10"

# Notification targets. Configure at least one. All reviews are posted to a
# single destination per channel.

# Optional: Slack webhook URL (sensitive, default: "")
# slack_webhook_url = "https://hooks.slack.com/services/YOUR/WEBHOOK/URL"

# Optional: Discord webhook URL (sensitive, default: "")
# discord_webhook_url = "https://discord.com/api/webhooks/YOUR/WEBHOOK/URL"

# Optional: Telegram bot token and chat ID (sensitive, default: "")
# telegram_bot_token = "123456789:YOUR-BOT-TOKEN"
# telegram_chat_id   = "-1001234567890"

