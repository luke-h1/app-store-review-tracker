import axios from 'axios';
import type { UnifiedReview } from '../types/reviews';

const PLATFORM_CONFIG = {
  apple: { emoji: '🍎', name: 'App Store' },
  google: { emoji: '🤖', name: 'Google Play' },
} as const;

// Discord embed colours keyed by rating (1-5).
const RATING_COLORS = [
  0xed4245, // 1 star - red
  0xed4245, // 2 star - red
  0xfee75c, // 3 star - yellow
  0x57f287, // 4 star - green
  0x57f287, // 5 star - green
] as const;

// Discord embed description limit is 4096 characters.
const truncate = (value: string, max: number): string =>
  value.length > max ? `${value.slice(0, max - 1)}…` : value;

const buildDiscordMessage = (review: UnifiedReview) => {
  const config = PLATFORM_CONFIG[review.platform];
  const stars = '⭐'.repeat(review.rating);
  const color = RATING_COLORS[review.rating - 1] ?? 0x5865f2;

  const title = review.title?.trim() || '(no title)';
  const content = review.content?.trim() || '(no content)';

  return {
    content: `New ${config.name} Review`,
    embeds: [
      {
        title: `${config.emoji} New ${config.name} Review`,
        description: truncate(`**${title}**\n\n${content}`, 4096),
        color,
        fields: [
          {
            name: 'Rating',
            value: `${stars} (${review.rating}/5)`,
            inline: true,
          },
          {
            name: 'Author',
            value: review.author?.trim() || 'Anonymous',
            inline: true,
          },
          {
            name: 'Date',
            value: new Date(review.date).toLocaleDateString(),
            inline: true,
          },
          ...(review.version
            ? [{ name: 'Version', value: review.version, inline: true }]
            : []),
        ],
      },
    ],
  };
};

export const discordService = {
  postReview: async (
    review: UnifiedReview,
    webhookUrl: string,
  ): Promise<void> => {
    if (!webhookUrl?.trim()) {
      console.warn('Webhook URL not provided, skipping Discord notification');
      return;
    }

    try {
      await axios.post(webhookUrl.trim(), buildDiscordMessage(review));
    } catch (error) {
      console.error('Error posting to Discord:', error);
      throw error;
    }
  },

  postReviews: async (
    reviews: UnifiedReview[],
    webhookUrl: string,
  ): Promise<void> => {
    for (const review of reviews) {
      await discordService.postReview(review, webhookUrl);
      if (reviews.length > 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
  },
};
