import axios from 'axios';
import type { UnifiedReview } from '../types/reviews';

const PLATFORM_CONFIG = {
  apple: { emoji: '🍎', name: 'App Store' },
  google: { emoji: '🤖', name: 'Google Play' },
} as const;

const buildSlackMessage = (review: UnifiedReview) => {
  const config = PLATFORM_CONFIG[review.platform];
  const stars = '⭐'.repeat(review.rating);

  return {
    text: `New ${config.name} Review`,
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `${config.emoji} New ${config.name} Review`,
        },
      },
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*Rating:*\n${stars} (${review.rating}/5)` },
          { type: 'mrkdwn', text: `*Author:*\n${review.author}` },
          {
            type: 'mrkdwn',
            text: `*Date:*\n${new Date(review.date).toLocaleDateString()}`,
          },
          ...(review.version
            ? [{ type: 'mrkdwn', text: `*Version:*\n${review.version}` }]
            : []),
        ],
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*${review.title}*\n\n${review.content}`,
        },
      },
    ],
  };
};

export const slackService = {
  postReview: async (
    review: UnifiedReview,
    webhookUrl: string,
  ): Promise<void> => {
    if (!webhookUrl?.trim()) {
      console.warn('Webhook URL not provided, skipping Slack notification');
      return;
    }

    try {
      await axios.post(webhookUrl.trim(), buildSlackMessage(review));
    } catch (error) {
      console.error('Error posting to Slack:', error);
      throw error;
    }
  },

  postReviews: async (
    reviews: UnifiedReview[],
    webhookUrl: string,
  ): Promise<void> => {
    for (const review of reviews) {
      await slackService.postReview(review, webhookUrl);
      if (reviews.length > 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
  },
};
