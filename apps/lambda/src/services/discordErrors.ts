/* eslint-disable no-console */
import axios from 'axios';
import type { ErrorNotification } from './slackErrors';

/**
 * Sends an error notification to Discord
 */
export const sendErrorToDiscord = async (
  webhookUrl: string,
  error: ErrorNotification,
): Promise<void> => {
  if (!webhookUrl) {
    console.warn('No webhook URL provided, cannot send error to Discord');
    return;
  }

  const timestamp = error.timestamp || new Date().toISOString();

  const fields = [
    { name: 'Error Type', value: error.errorType, inline: true },
    {
      name: 'Time',
      value: new Date(timestamp).toLocaleString(),
      inline: true,
    },
    { name: 'Message', value: error.message.slice(0, 1024), inline: false },
  ];

  if (error.validationErrors && error.validationErrors.length > 0) {
    const errorList = error.validationErrors
      .map(e => {
        const path = e.path.length > 0 ? e.path.join('.') : 'root';
        return `• **${path}**: ${e.message}`;
      })
      .join('\n');
    fields.push({
      name: 'Validation Errors',
      value: errorList.slice(0, 1024),
      inline: false,
    });
  }

  if (error.details) {
    fields.push({
      name: 'Details',
      value: `\`\`\`${error.details.slice(0, 1010)}\`\`\``,
      inline: false,
    });
  }

  const message = {
    content: `❌ Review Tracker Error: ${error.errorType}`,
    embeds: [
      {
        title: '❌ Review Tracker Error',
        color: 0xed4245,
        fields,
      },
    ],
  };

  try {
    await axios.post(webhookUrl, message, {
      timeout: 5000, // 5 second timeout
    });
    console.log('Error notification sent to Discord successfully');
  } catch (discordError) {
    // Don't throw - we don't want Discord errors to break the main flow
    console.error(
      'Failed to send error notification to Discord:',
      discordError,
    );
    console.error('Original error details:', JSON.stringify(error, null, 2));
  }
};
