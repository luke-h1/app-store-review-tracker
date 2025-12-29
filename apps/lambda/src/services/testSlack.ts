import { slackService } from './slack';
import type { UnifiedReview } from '../types/reviews';

export interface TestSlackResult {
  webhook: string;
  success: boolean;
  error?: string;
}

export const testSlackService = {
  createTestReview: (): UnifiedReview => ({
    id: 'test-review-123',
    platform: 'apple',
    appId: 'test-app-id',
    rating: 5,
    title: 'Test Review - Slack Connection Verified',
    content:
      'This is a test review to verify your Slack webhook is configured correctly. If you see this message, your integration is working!',
    author: 'App Store Review Tracker',
    date: new Date().toISOString(),
    version: '1.0.0',
    createdAt: Date.now(),
  }),

  testWebhooks: async (
    webhookMap: Map<string, string[]>,
    testReview: UnifiedReview,
  ): Promise<TestSlackResult[]> => {
    const results = await Promise.allSettled(
      Array.from(webhookMap.entries()).map(async ([appKey, urls]) => {
        const webhookUrl = urls[0]?.trim();
        if (!webhookUrl) {
          return {
            webhook: appKey,
            success: false,
            error: 'Empty webhook URL',
          };
        }

        try {
          await slackService.postReview(testReview, webhookUrl);
          return { webhook: appKey, success: true };
        } catch (error) {
          return {
            webhook: appKey,
            success: false,
            error:
              error instanceof Error ? error.message : 'Unknown error occurred',
          };
        }
      }),
    );

    return results.map(r =>
      r.status === 'fulfilled'
        ? r.value
        : { webhook: 'unknown', success: false, error: String(r.reason) },
    );
  },
};
