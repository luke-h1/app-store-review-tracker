declare global {
  namespace NodeJS {
    interface ProcessEnv {
      API_KEY: string;
      GIT_SHA: string;
      DEPLOYED_AT: string;
      APPLE_APP_IDS?: string;
      GOOGLE_APP_IDS?: string;
      APP_SLACK_WEBHOOK_MAP?: string;
      COUNTRY?: string;
      REVIEW_LIMIT?: string;
      SORT_BY?: string;
      REVIEWS_TABLE_NAME?: string;
      AWS_REGION?: string;
    }
  }
}

export {};
