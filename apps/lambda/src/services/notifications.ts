import { slackService } from './slack';
import { discordService } from './discord';
import { telegramService, type TelegramConfig } from './telegram';
import { sendErrorToSlack, formatError } from './slackErrors';
import { sendErrorToDiscord } from './discordErrors';
import { sendErrorToTelegram } from './telegramErrors';
import type { UnifiedReview } from '../types/reviews';

export type Channel = 'slack' | 'discord' | 'telegram';

interface Targets {
  slackWebhookUrl?: string;
  discordWebhookUrl?: string;
  telegram?: TelegramConfig;
}

const getTargets = (): Targets => {
  const botToken = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const chatId = process.env.TELEGRAM_CHAT_ID?.trim();

  return {
    slackWebhookUrl: process.env.SLACK_WEBHOOK_URL?.trim() || undefined,
    discordWebhookUrl: process.env.DISCORD_WEBHOOK_URL?.trim() || undefined,
    telegram: botToken && chatId ? { botToken, chatId } : undefined,
  };
};

export const hasNotificationTarget = (): boolean => {
  const { slackWebhookUrl, discordWebhookUrl, telegram } = getTargets();
  return Boolean(slackWebhookUrl || discordWebhookUrl || telegram);
};

/**
 * Posts new reviews to every configured channel. All reviews go to a single
 * destination per channel, so failures are isolated - one channel being down
 * never blocks the others.
 */
export const notifyReviews = async (
  reviews: UnifiedReview[],
): Promise<void> => {
  const { slackWebhookUrl, discordWebhookUrl, telegram } = getTargets();

  await Promise.allSettled([
    ...(slackWebhookUrl
      ? [slackService.postReviews(reviews, slackWebhookUrl)]
      : []),
    ...(discordWebhookUrl
      ? [discordService.postReviews(reviews, discordWebhookUrl)]
      : []),
    ...(telegram ? [telegramService.postReviews(reviews, telegram)] : []),
  ]);
};

/**
 * Posts a formatted error to every configured channel.
 */
export const notifyError = async (
  error: unknown,
  operation: string,
): Promise<void> => {
  const { slackWebhookUrl, discordWebhookUrl, telegram } = getTargets();
  const notification = formatError(error, { operation });

  await Promise.allSettled([
    ...(slackWebhookUrl
      ? [sendErrorToSlack(slackWebhookUrl, notification)]
      : []),
    ...(discordWebhookUrl
      ? [sendErrorToDiscord(discordWebhookUrl, notification)]
      : []),
    ...(telegram ? [sendErrorToTelegram(telegram, notification)] : []),
  ]);
};

const createTestReview = (channel: Channel): UnifiedReview => ({
  id: 'test-review-123',
  platform: 'apple',
  appId: 'test-app-id',
  rating: 5,
  title: `Test Review - ${channel} connection verified`,
  content: `This is a test review to check your ${channel} integration. If you can see this, it works!`,
  author: 'App Store Review Tracker',
  date: new Date().toISOString(),
  version: '1.0.0',
  createdAt: Date.now(),
});

export interface TestResult {
  configured: boolean;
  success: boolean;
  error?: string;
}

/**
 * Sends a single test review to one channel so its config can be verified.
 */
export const sendTestNotification = async (
  channel: Channel,
): Promise<TestResult> => {
  const { slackWebhookUrl, discordWebhookUrl, telegram } = getTargets();
  const review = createTestReview(channel);

  try {
    if (channel === 'slack') {
      if (!slackWebhookUrl) return { configured: false, success: false };
      await slackService.postReview(review, slackWebhookUrl);
    } else if (channel === 'discord') {
      if (!discordWebhookUrl) return { configured: false, success: false };
      await discordService.postReview(review, discordWebhookUrl);
    } else {
      if (!telegram) return { configured: false, success: false };
      await telegramService.postReview(review, telegram);
    }
    return { configured: true, success: true };
  } catch (error) {
    return {
      configured: true,
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
};
