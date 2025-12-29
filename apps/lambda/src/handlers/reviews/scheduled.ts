import { EventBridgeEvent } from 'aws-lambda';
import { reviewsService } from '../../services/reviews';
import { dynamodbService } from '../../services/dynamodb';
import { slackService } from '../../services/slack';
import {
  sendErrorToSlack,
  formatErrorForSlack,
} from '../../services/slackErrors';
import { parseAppIds } from '../../util/appIds';
import { parseWebhookMap, getUniqueWebhooks } from '../../util/webhookMap';
import type { ReviewCheckEvent } from '../../types/config';
import type { UnifiedReview } from '../../types/reviews';

type ReviewWithMetadata = {
  review: UnifiedReview;
  appId: string;
  platform: 'apple' | 'google';
};

export const scheduledReviewHandler = async (
  event: EventBridgeEvent<'Scheduled Event', unknown>,
): Promise<void> => {
  try {
    const eventDetail = (event.detail || {}) as ReviewCheckEvent;
    const appleAppIds =
      eventDetail.appleAppIds || parseAppIds(process.env.APPLE_APP_IDS);
    const googleAppIds =
      eventDetail.googleAppIds || parseAppIds(process.env.GOOGLE_APP_IDS);
    const appWebhookMap = parseWebhookMap(process.env.APP_SLACK_WEBHOOK_MAP);

    if (appWebhookMap.size === 0) {
      throw new Error(
        'No Slack webhook URLs configured in APP_SLACK_WEBHOOK_MAP',
      );
    }

    const country = eventDetail.country || process.env.COUNTRY || 'gb';
    const limit =
      eventDetail.limit || parseInt(process.env.REVIEW_LIMIT || '10', 10);
    const sortBy =
      eventDetail.sortBy ||
      (process.env.SORT_BY as 'mostRecent' | 'mostHelpful') ||
      'mostRecent';

    if (appleAppIds.length === 0 && googleAppIds.length === 0) {
      return;
    }

    const allReviews = await reviewsService.fetchForApps(
      appleAppIds,
      googleAppIds,
      {
        country,
        limit,
        sortBy,
      },
    );

    const reviewsWithMetadata: ReviewWithMetadata[] = allReviews.map(
      review => ({
        review,
        appId: review.appId,
        platform: review.platform,
      }),
    );

    const newReviews: ReviewWithMetadata[] = [];
    const reviewChecks = reviewsWithMetadata.map(
      async ({ review, appId, platform }) => {
        const reviewIdentifier = dynamodbService.getReviewId(
          platform,
          appId,
          review.id,
        );
        const exists = await dynamodbService.reviewExists(reviewIdentifier);
        if (!exists) {
          await dynamodbService.storeReview(review, reviewIdentifier);
          return { review, appId, platform };
        }
        return null;
      },
    );

    const results = await Promise.all(reviewChecks);
    newReviews.push(
      ...results.filter((r): r is ReviewWithMetadata => r !== null),
    );

    if (newReviews.length > 0) {
      const reviewsByApp = new Map<string, UnifiedReview[]>();
      for (const { review, appId, platform } of newReviews) {
        const key = `${platform}:${appId}`;
        if (!reviewsByApp.has(key)) {
          reviewsByApp.set(key, []);
        }
        reviewsByApp.get(key)!.push(review);
      }

      const postTasks = Array.from(reviewsByApp.entries()).flatMap(
        ([appKey, reviews]) => {
          const webhookUrls = appWebhookMap.get(appKey);
          if (!webhookUrls?.length) {
            console.warn(
              `No Slack webhook configured for ${appKey}, skipping notification`,
            );
            return [];
          }
          return webhookUrls
            .filter(url => url.trim())
            .map(async url => {
              try {
                await slackService.postReviews(reviews, url.trim());
              } catch (error) {
                console.error(
                  `Error posting to Slack webhook ${url} for ${appKey}:`,
                  error,
                );
              }
            });
        },
      );

      await Promise.all(postTasks);
    }
  } catch (error) {
    console.error('Error in scheduled review handler:', error);

    const webhookMap = parseWebhookMap(process.env.APP_SLACK_WEBHOOK_MAP);
    const uniqueWebhooks = getUniqueWebhooks(webhookMap);

    await Promise.allSettled(
      Array.from(uniqueWebhooks).map(async webhookUrl => {
        try {
          const errorNotification = formatErrorForSlack(error, {
            operation: 'scheduled review check',
          });
          await sendErrorToSlack(webhookUrl, errorNotification);
        } catch (slackError) {
          console.error(
            `Failed to send error notification to Slack ${webhookUrl}:`,
            slackError,
          );
        }
      }),
    );

    throw error;
  }
};
