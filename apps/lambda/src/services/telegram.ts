import axios from 'axios';
import type { UnifiedReview } from '../types/reviews';

const PLATFORM_CONFIG = {
  apple: { emoji: '🍎', name: 'App Store' },
  google: { emoji: '🤖', name: 'Google Play' },
} as const;

export interface TelegramConfig {
  botToken: string;
  chatId: string;
}

// Escapes characters that are unsafe inside Telegram HTML-mode messages.
export const escapeHtml = (value: string): string =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const buildTelegramMessage = (review: UnifiedReview): string => {
  const config = PLATFORM_CONFIG[review.platform];
  const stars = '⭐'.repeat(review.rating);

  const title = escapeHtml(review.title?.trim() || '(no title)');
  const content = escapeHtml(review.content?.trim() || '(no content)');
  const author = escapeHtml(review.author?.trim() || 'Anonymous');

  const lines = [
    `${config.emoji} <b>New ${config.name} Review</b>`,
    '',
    `<b>Rating:</b> ${stars} (${review.rating}/5)`,
    `<b>Author:</b> ${author}`,
    `<b>Date:</b> ${new Date(review.date).toLocaleDateString()}`,
    ...(review.version
      ? [`<b>Version:</b> ${escapeHtml(review.version)}`]
      : []),
    '',
    `<b>${title}</b>`,
    content,
  ];

  return lines.join('\n');
};

const sendMessage = async (
  config: TelegramConfig,
  text: string,
): Promise<void> => {
  const url = `https://api.telegram.org/bot${config.botToken}/sendMessage`;
  await axios.post(url, {
    chat_id: config.chatId,
    text,
    parse_mode: 'HTML',
    disable_web_page_preview: true,
  });
};

export const telegramService = {
  sendMessage,

  postReview: async (
    review: UnifiedReview,
    config: TelegramConfig,
  ): Promise<void> => {
    if (!config.botToken?.trim() || !config.chatId?.trim()) {
      console.warn(
        'Telegram bot token or chat ID not provided, skipping notification',
      );
      return;
    }

    try {
      await sendMessage(config, buildTelegramMessage(review));
    } catch (error) {
      console.error('Error posting to Telegram:', error);
      throw error;
    }
  },

  postReviews: async (
    reviews: UnifiedReview[],
    config: TelegramConfig,
  ): Promise<void> => {
    for (const review of reviews) {
      await telegramService.postReview(review, config);
      if (reviews.length > 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
  },
};
