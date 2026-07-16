import { EventBridgeEvent } from 'aws-lambda';
import { reviewsService } from '../../services/reviews';
import { dynamodbService } from '../../services/dynamodb';
import {
  notifyReviews,
  notifyError,
  hasNotificationTarget,
} from '../../services/notifications';
import { parseAppIds } from '../../util/appIds';
import type { ReviewCheckEvent } from '../../types/config';
import type { UnifiedReview } from '../../types/reviews';

export const scheduledReviewHandler = async (
  event: EventBridgeEvent<'Scheduled Event', unknown>,
): Promise<void> => {
  try {
    const eventDetail = (event.detail || {}) as ReviewCheckEvent;
    const appleAppIds =
      eventDetail.appleAppIds || parseAppIds(process.env.APPLE_APP_IDS);
    const googleAppIds =
      eventDetail.googleAppIds || parseAppIds(process.env.GOOGLE_APP_IDS);

    if (!hasNotificationTarget()) {
      throw new Error(
        'No notification targets configured (SLACK_WEBHOOK_URL, DISCORD_WEBHOOK_URL or TELEGRAM_BOT_TOKEN/TELEGRAM_CHAT_ID)',
      );
    }

    if (appleAppIds.length === 0 && googleAppIds.length === 0) {
      return;
    }

    const country = eventDetail.country || process.env.COUNTRY || 'gb';
    const limit =
      eventDetail.limit ||
      Number.parseInt(process.env.REVIEW_LIMIT || '10', 10);
    const sortBy =
      eventDetail.sortBy ||
      (process.env.SORT_BY as 'mostRecent' | 'mostHelpful') ||
      'mostRecent';

    const allReviews = await reviewsService.fetchForApps(
      appleAppIds,
      googleAppIds,
      { country, limit, sortBy },
    );

    const newReviews = await storeNewReviews(allReviews);

    if (newReviews.length > 0) {
      await notifyReviews(newReviews);
    }
  } catch (error) {
    console.error('Error in scheduled review handler:', error);
    await notifyError(error, 'scheduled review check');
    throw error;
  }
};

/**
 * Stores any reviews we haven't seen before and returns the new ones.
 */
const storeNewReviews = async (
  reviews: UnifiedReview[],
): Promise<UnifiedReview[]> => {
  const checks = reviews.map(async review => {
    const reviewId = dynamodbService.getReviewId(
      review.platform,
      review.appId,
      review.id,
    );

    if (await dynamodbService.reviewExists(reviewId)) {
      return null;
    }

    await dynamodbService.storeReview(review, reviewId);
    return review;
  });

  const results = await Promise.all(checks);
  return results.filter((review): review is UnifiedReview => review !== null);
};
