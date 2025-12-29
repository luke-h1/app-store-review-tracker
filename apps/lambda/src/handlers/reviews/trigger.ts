/* eslint-disable no-console */
import { EventBridgeEvent } from 'aws-lambda';
import { scheduledReviewHandler } from './scheduled';

interface TriggerResponse {
  success: boolean;
  message: string;
  error?: string;
}

export const triggerReviewHandler = async (): Promise<string> => {
  try {
    const eventBridgeEvent: EventBridgeEvent<'Scheduled Event', unknown> = {
      version: '0',
      id: `manual-trigger-${Date.now()}`,
      'detail-type': 'Scheduled Event',
      source: 'manual.trigger',
      account: '',
      time: new Date().toISOString(),
      region: process.env.AWS_REGION || 'eu-west-2',
      resources: [],
      detail: {},
    };

    await scheduledReviewHandler(eventBridgeEvent);

    const response: TriggerResponse = {
      success: true,
      message: 'Scheduled review check triggered successfully',
    };

    return JSON.stringify(response, null, 2);
  } catch (error) {
    console.error('Error triggering review check:', error);

    const errorResponse: TriggerResponse = {
      success: false,
      message: 'Failed to trigger review check',
      error: error instanceof Error ? error.message : String(error),
    };

    return JSON.stringify(errorResponse, null, 2);
  }
};

export default triggerReviewHandler;
