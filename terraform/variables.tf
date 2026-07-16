variable "env" {
  type        = string
  description = "The environment to deploy to"
}

variable "zone_id" {
  type        = string
  description = "The zone id for the route53 record"
}

variable "root_domain" {
  type        = string
  description = "The root domain for the route53 record"
  default     = "foam-app.com"
}

variable "private_key" {
  type        = string
  description = "The private key for the certificate"
}

variable "certificate_body" {
  type        = string
  description = "The certificate body for the certificate"
}

variable "certificate_chain" {
  type        = string
  description = "The certificate chain for the certificate"
}

variable "tags" {
  type        = map(string)
  description = "The tags to apply to the resources"
  default = {
    "Service"   = "AppStoreReviewerTracker"
    "ManagedBy" = "Terraform"
  }
}

variable "git_sha" {
  type        = string
  description = "the git sha that triggered the deployment"
  default     = "change-me"
}

variable "deployed_by" {
  type        = string
  description = "Who initiated the deployment?"
  default     = "luke-h1"
}

variable "project_name" {
  type        = string
  description = "name of the project"
  default     = "appstore-review-tracker"
}

variable "api_key" {
  type        = string
  description = "the API key to set on the authorizer"
  sensitive   = true
}

variable "apple_app_ids" {
  type        = list(string)
  description = "List of Apple App Store app IDs"
  default = [
    # foam
    "6742071860"
  ]
}

variable "google_app_ids" {
  type        = list(string)
  description = "List of Google Play Store app IDs"
  default     = []
}

variable "apple_country" {
  type        = string
  description = "Country code for Apple App Store reviews (e.g., 'gb', 'us')"
  default     = "gb"
}

variable "review_limit" {
  type        = string
  description = "Maximum number of reviews to fetch per check"
  default     = "10"
}

variable "slack_webhook_url" {
  type        = string
  description = "Slack webhook URL to post new reviews to. All reviews are posted to this single channel."
  sensitive   = true
  default     = ""
}

variable "discord_webhook_url" {
  type        = string
  description = "Discord webhook URL to post new reviews to. All reviews are posted to this single channel."
  sensitive   = true
  default     = ""
}

variable "telegram_bot_token" {
  type        = string
  description = "Telegram bot token used to post new reviews. Leave empty to disable Telegram notifications."
  sensitive   = true
  default     = ""
}

variable "telegram_chat_id" {
  type        = string
  description = "Telegram chat ID to post new reviews to. All reviews are posted to this single chat."
  sensitive   = true
  default     = ""
}

