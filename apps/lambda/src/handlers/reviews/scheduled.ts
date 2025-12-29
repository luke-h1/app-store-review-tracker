import { EventBridgeEvent } from 'aws-lambda';
import { fetchAppleReviews } from '../../services/appleReviews';
import { fetchGoogleReviews } from '../../services/googleReviews';
import { reviewExists, storeReview } from '../../services/dynamodb';
import { postReviewsToSlack } from '../../services/slack';
import {
  sendErrorToSlack,
  formatErrorForSlack,
} from '../../services/slackErrors';
import type { ReviewCheckEvent } from '../../types/config';
import type { ReviewHandlerParams } from '../../types/reviews';

/**
 * Scheduled handler for review checks
 * Processes all configured app IDs and posts new reviews to Slack channels
 */
export const scheduledReviewHandler = async (
  event: EventBridgeEvent<'Scheduled Event', unknown>,
): Promise<void> => {
  console.log('Scheduled review check triggered:', event);

  let slackWebhookUrls: string[] = [];

  try {
    // Get config from event detail or environment variables
    const eventDetail = (event.detail || {}) as ReviewCheckEvent;

    const appleAppIds =
      eventDetail.appleAppIds ||
      (process.env.APPLE_APP_IDS ? process.env.APPLE_APP_IDS.split(',') : []);
    const googleAppIds =
      eventDetail.googleAppIds ||
      (process.env.GOOGLE_APP_IDS ? process.env.GOOGLE_APP_IDS.split(',') : []);
    slackWebhookUrls =
      eventDetail.slackWebhookUrls ||
      (process.env.SLACK_WEBHOOK_URLS
        ? process.env.SLACK_WEBHOOK_URLS.split(',')
        : []);

    const country = eventDetail.country || process.env.COUNTRY || 'gb';
    const limit =
      eventDetail.limit || parseInt(process.env.REVIEW_LIMIT || '10', 10);
    const sortBy =
      eventDetail.sortBy ||
      (process.env.SORT_BY as 'mostRecent' | 'mostHelpful') ||
      'mostRecent';

    if (slackWebhookUrls.length === 0) {
      throw new Error('No Slack webhook URLs configured');
    }

    if (appleAppIds.length === 0 && googleAppIds.length === 0) {
      console.log('No app IDs configured, skipping review check');
      return;
    }

    console.log(
      `Processing ${appleAppIds.length} Apple apps and ${googleAppIds.length} Google apps`,
    );

    const allReviews: Array<{
      review: import('../../types/reviews').UnifiedReview;
      appId: string;
      platform: 'apple' | 'google';
    }> = [];

    // Fetch reviews for all Apple apps
    for (const appleAppId of appleAppIds) {
      if (!appleAppId.trim()) continue;

      try {
        const params: ReviewHandlerParams = {
          appleAppId: appleAppId.trim(),
          country,
          limit,
          sortBy,
        };
        const reviews = await fetchAppleReviews(params);
        reviews.forEach(review => {
          allReviews.push({
            review,
            appId: appleAppId.trim(),
            platform: 'apple',
          });
        });
        console.log(
          `Fetched ${reviews.length} reviews for Apple app ${appleAppId}`,
        );
      } catch (error) {
        console.error(
          `Error fetching Apple reviews for app ${appleAppId}:`,
          error,
        );
      }
    }

    // Fetch reviews for all Google apps
    for (const googleAppId of googleAppIds) {
      if (!googleAppId.trim()) continue;

      try {
        const params: ReviewHandlerParams = {
          googleAppId: googleAppId.trim(),
          country,
          limit,
          sortBy,
        };
        const reviews = await fetchGoogleReviews(params);
        reviews.forEach(review => {
          allReviews.push({
            review,
            appId: googleAppId.trim(),
            platform: 'google',
          });
        });
        console.log(
          `Fetched ${reviews.length} reviews for Google app ${googleAppId}`,
        );
      } catch (error) {
        console.error(
          `Error fetching Google reviews for app ${googleAppId}:`,
          error,
        );
      }
    }

    console.log(`Fetched ${allReviews.length} total reviews`);

    // Get new reviews (using a simple identifier based on platform + app ID + review ID)
    const newReviews: typeof allReviews = [];
    for (const { review, appId, platform } of allReviews) {
      const reviewIdentifier = `${platform}#${appId}#${review.id}`;
      const exists = await reviewExists(reviewIdentifier);
      if (!exists) {
        newReviews.push({ review, appId, platform });
        await storeReview(review, reviewIdentifier);
      }
    }

    console.log(`Found ${newReviews.length} new reviews`);

    // Post new reviews to all configured Slack channels
    if (newReviews.length > 0) {
      const reviewsToPost = newReviews.map(({ review }) => review);
      for (const webhookUrl of slackWebhookUrls) {
        if (webhookUrl.trim()) {
          try {
            await postReviewsToSlack(reviewsToPost, webhookUrl.trim());
            console.log(
              `Posted ${reviewsToPost.length} reviews to Slack channel`,
            );
          } catch (error) {
            console.error(
              `Error posting to Slack webhook ${webhookUrl}:`,
              error,
            );
          }
        }
      }
    } else {
      console.log('No new reviews to post');
    }
  } catch (error) {
    console.error('Error in scheduled review handler:', error);

    // Send error to all Slack channels
    for (const webhookUrl of slackWebhookUrls) {
      if (webhookUrl.trim()) {
        try {
          const errorNotification = formatErrorForSlack(error, {
            operation: 'scheduled review check',
          });
          await sendErrorToSlack(webhookUrl.trim(), errorNotification);
        } catch (slackError) {
          console.error(
            `Failed to send error notification to Slack ${webhookUrl}:`,
            slackError,
          );
        }
      }
    }

    throw error;
  }
};
