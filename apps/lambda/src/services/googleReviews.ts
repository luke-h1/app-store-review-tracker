/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/require-await */
import axios from 'axios';
import type { UnifiedReview, ReviewHandlerParams } from '../types/reviews';

export const fetchGoogleReviews = async (
  params: ReviewHandlerParams,
): Promise<UnifiedReview[]> => {
  const { googleAppId } = params;

  if (!googleAppId) {
    return [];
  }

  try {
    // 1. Set up Google Play Console API credentials
    // 2. Use the googleapis npm package
    // 3. Authenticate with a service account

    // const { google } = require('googleapis');
    // const androidpublisher = google.androidpublisher('v3');

    console.warn(
      'Google Play Reviews API requires authentication. Please implement using googleapis package.',
    );

    // const response = await androidpublisher.reviews.list({
    //   packageName: googleAppId,
    //   maxResults: params.limit || 10,
    // });

    // TODO: Implement Google Play Reviews API integration
    return [];
  } catch (error) {
    console.error('Error fetching Google reviews:', error);

    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const statusText = error.response?.statusText;
      const message = status
        ? `Failed to fetch Google reviews for app ID ${googleAppId} (HTTP ${status} ${statusText})`
        : `Failed to fetch Google reviews for app ID ${googleAppId}: ${error.message}`;
      throw new Error(message);
    }

    throw new Error(
      `Failed to fetch Google reviews for app ID ${googleAppId}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
};
