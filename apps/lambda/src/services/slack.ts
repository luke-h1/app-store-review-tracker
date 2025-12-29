import axios from 'axios';
import type { UnifiedReview } from '../types/reviews';

export const postReviewToSlack = async (
  review: UnifiedReview,
  webhookUrl: string,
): Promise<void> => {
  if (!webhookUrl) {
    console.warn('Webhook URL not provided, skipping Slack notification');
    return;
  }

  const platformEmoji = review.platform === 'apple' ? '🍎' : '🤖';
  const stars = '⭐'.repeat(review.rating);

  const message = {
    text: `New ${review.platform === 'apple' ? 'App Store' : 'Google Play'} Review`,
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `${platformEmoji} New ${review.platform === 'apple' ? 'App Store' : 'Google Play'} Review`,
        },
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Rating:*\n${stars} (${review.rating}/5)`,
          },
          {
            type: 'mrkdwn',
            text: `*Author:*\n${review.author}`,
          },
          {
            type: 'mrkdwn',
            text: `*Date:*\n${new Date(review.date).toLocaleDateString()}`,
          },
          ...(review.version
            ? [
                {
                  type: 'mrkdwn',
                  text: `*Version:*\n${review.version}`,
                },
              ]
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

  try {
    await axios.post(webhookUrl, message);
  } catch (error) {
    console.error('Error posting to Slack:', error);
    throw error;
  }
};

export const postReviewsToSlack = async (
  reviews: UnifiedReview[],
  webhookUrl: string,
): Promise<void> => {
  for (const review of reviews) {
    await postReviewToSlack(review, webhookUrl);
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }
};
