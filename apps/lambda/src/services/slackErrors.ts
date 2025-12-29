/* eslint-disable no-console */
import axios from 'axios';
import { z } from 'zod';
import { ValidationException } from '../util/validation';

interface SlackErrorNotification {
  errorType: string;
  message: string;
  details?: string;
  validationErrors?: z.ZodIssue[];
  timestamp?: string;
}

/**
 * Sends an error notification to Slack
 */
export const sendErrorToSlack = async (
  webhookUrl: string,
  error: SlackErrorNotification,
): Promise<void> => {
  if (!webhookUrl) {
    console.warn('No webhook URL provided, cannot send error to Slack');
    return;
  }

  const timestamp = error.timestamp || new Date().toISOString();

  // Build validation errors section if present
  let validationSection = '';
  if (error.validationErrors && error.validationErrors.length > 0) {
    const errorList = error.validationErrors
      .map(e => {
        const path = e.path.length > 0 ? e.path.join('.') : 'root';
        return `• *${path}*: ${e.message}`;
      })
      .join('\n');
    validationSection = `\n*Validation Errors:*\n${errorList}`;
  }

  const message = {
    text: `❌ Review Tracker Error: ${error.errorType}`,
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: '❌ Review Tracker Error',
        },
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Error Type:*\n${error.errorType}`,
          },
          {
            type: 'mrkdwn',
            text: `*Time:*\n${new Date(timestamp).toLocaleString()}`,
          },
        ],
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Message:*\n${error.message}${validationSection}`,
        },
      },
      ...(error.details
        ? [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `*Details:*\n\`\`\`${error.details}\`\`\``,
              },
            },
          ]
        : []),
    ],
  };

  try {
    await axios.post(webhookUrl, message, {
      timeout: 5000, // 5 second timeout
    });
    console.log('Error notification sent to Slack successfully');
  } catch (slackError) {
    // Don't throw - we don't want Slack errors to break the main flow
    console.error('Failed to send error notification to Slack:', slackError);
    // Log the original error details for debugging
    console.error('Original error details:', JSON.stringify(error, null, 2));
  }
};

/**
 * Formats an error for Slack notification
 */
export const formatErrorForSlack = (
  error: unknown,
  context?: {
    operation?: string;
  },
): SlackErrorNotification => {
  const operation = context?.operation || 'Unknown operation';

  if (error instanceof Error) {
    // Check if it's a validation error (ValidationException or ZodError)
    if (error instanceof ValidationException) {
      return {
        errorType: 'Validation Error',
        message: `Invalid parameters provided for ${operation}`,
        details: error.message,
        validationErrors: error.errors,
        timestamp: new Date().toISOString(),
      };
    }

    // Check if it's a ZodError directly
    if (error instanceof z.ZodError) {
      return {
        errorType: 'Validation Error',
        message: `Invalid parameters provided for ${operation}`,
        details: error.message,
        validationErrors: error.issues,
        timestamp: new Date().toISOString(),
      };
    }

    // Check if it's an axios error (API request failure)
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const statusText = status ? ` (HTTP ${status})` : '';
      return {
        errorType: 'API Request Error',
        message: `Failed to fetch reviews${statusText}`,
        details: error.message,
        timestamp: new Date().toISOString(),
      };
    }

    // Generic error
    return {
      errorType: 'Processing Error',
      message: `An error occurred during ${operation}`,
      details: error.message,
      timestamp: new Date().toISOString(),
    };
  }

  // Unknown error type
  return {
    errorType: 'Unknown Error',
    message: `An unexpected error occurred during ${operation}`,
    details: String(error),
    timestamp: new Date().toISOString(),
  };
};
