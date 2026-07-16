/* eslint-disable no-console */
import { telegramService, escapeHtml, type TelegramConfig } from './telegram';
import type { ErrorNotification } from './slackErrors';

/**
 * Sends an error notification to Telegram
 */
export const sendErrorToTelegram = async (
  config: TelegramConfig,
  error: ErrorNotification,
): Promise<void> => {
  if (!config.botToken?.trim() || !config.chatId?.trim()) {
    console.warn(
      'Telegram bot token or chat ID not provided, cannot send error',
    );
    return;
  }

  const timestamp = error.timestamp || new Date().toISOString();

  const lines = [
    '❌ <b>Review Tracker Error</b>',
    '',
    `<b>Error Type:</b> ${escapeHtml(error.errorType)}`,
    `<b>Time:</b> ${new Date(timestamp).toLocaleString()}`,
    `<b>Message:</b> ${escapeHtml(error.message)}`,
  ];

  if (error.validationErrors && error.validationErrors.length > 0) {
    lines.push('', '<b>Validation Errors:</b>');
    for (const e of error.validationErrors) {
      const path = e.path.length > 0 ? e.path.join('.') : 'root';
      lines.push(`• <b>${escapeHtml(path)}</b>: ${escapeHtml(e.message)}`);
    }
  }

  if (error.details) {
    lines.push(
      '',
      '<b>Details:</b>',
      `<pre>${escapeHtml(error.details)}</pre>`,
    );
  }

  try {
    await telegramService.sendMessage(config, lines.join('\n'));
    console.log('Error notification sent to Telegram successfully');
  } catch (telegramError) {
    // Don't throw - we don't want Telegram errors to break the main flow
    console.error(
      'Failed to send error notification to Telegram:',
      telegramError,
    );
    console.error('Original error details:', JSON.stringify(error, null, 2));
  }
};
