declare global {
  namespace NodeJS {
    interface ProcessEnv {
      API_KEY: string;
      GIT_SHA: string;
      DEPLOYED_AT: string;
      APPLE_APP_IDS?: string;
      GOOGLE_APP_IDS?: string;
      SLACK_WEBHOOK_URL?: string;
      DISCORD_WEBHOOK_URL?: string;
      TELEGRAM_BOT_TOKEN?: string;
      TELEGRAM_CHAT_ID?: string;
      COUNTRY?: string;
      REVIEW_LIMIT?: string;
      SORT_BY?: string;
      REVIEWS_TABLE_NAME?: string;
      AWS_REGION?: string;
    }
  }
}

export {};
