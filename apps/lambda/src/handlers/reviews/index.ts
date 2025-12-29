import { APIGatewayProxyEventQueryStringParameters } from 'aws-lambda';
import { fetchAppleReviews } from '../../services/appleReviews';
import { fetchGoogleReviews } from '../../services/googleReviews';
import { reviewExists, storeReview } from '../../services/dynamodb';
import { postReviewsToSlack } from '../../services/slack';
import {
  sendErrorToSlack,
  formatErrorForSlack,
} from '../../services/slackErrors';
import {
  validateReviewHandlerParams,
  ValidationException,
} from '../../util/validation';
import type { ReviewHandlerParams, UnifiedReview } from '../../types/reviews';

interface ReviewHandlerResponse {
  success: boolean;
  message: string;
  newReviewsCount: number;
  totalReviewsFetched: number;
  reviews?: UnifiedReview[];
  error?: string;
  validationErrors?: Array<{ field: string; message: string }>;
}

const reviewHandler = async (
  queryParams: APIGatewayProxyEventQueryStringParameters | null,
): Promise<string> => {
  let slackWebhookUrl: string | undefined;

  try {
    // Parse query parameters
    const limitParam = queryParams?.limit;
    const parsedLimit = limitParam ? parseInt(limitParam, 10) : undefined;

    const params: ReviewHandlerParams = {
      appleAppId: queryParams?.appleAppId,
      googleAppId: queryParams?.googleAppId,
      country: queryParams?.country || 'gb',
      limit: parsedLimit,
      sortBy:
        queryParams?.sortBy === 'mostHelpful' ? 'mostHelpful' : 'mostRecent',
    };

    // Validate parameters
    validateReviewHandlerParams(params);

    slackWebhookUrl = queryParams?.slackWebhookUrl || '';

    const [appleReviews, googleReviews] = await Promise.all([
      fetchAppleReviews(params).catch(error => {
        console.error('Error fetching Apple reviews:', error);
        return [];
      }),
      fetchGoogleReviews(params).catch(error => {
        console.error('Error fetching Google reviews:', error);
        return [];
      }),
    ]);

    const allReviews: UnifiedReview[] = [...appleReviews, ...googleReviews];

    // Get new reviews (using simple identifier based on platform + app ID + review ID)
    const newReviews: UnifiedReview[] = [];
    for (const review of allReviews) {
      const reviewIdentifier = `${review.platform}#${review.appId}#${review.id}`;
      const exists = await reviewExists(reviewIdentifier);
      if (!exists) {
        newReviews.push(review);
        await storeReview(review, reviewIdentifier);
      }
    }

    if (newReviews.length > 0 && slackWebhookUrl) {
      await postReviewsToSlack(newReviews, slackWebhookUrl);
    }

    const response: ReviewHandlerResponse = {
      success: true,
      message: `Processed ${allReviews.length} reviews, found ${newReviews.length} new reviews`,
      newReviewsCount: newReviews.length,
      totalReviewsFetched: allReviews.length,
      reviews: newReviews.length > 0 ? newReviews : undefined,
    };

    return JSON.stringify(response, null, 2);
  } catch (error) {
    console.error('Error in review handler:', error);

    if (slackWebhookUrl) {
      try {
        const errorNotification = formatErrorForSlack(error, {
          operation: 'API review check',
        });
        await sendErrorToSlack(slackWebhookUrl, errorNotification);
      } catch (slackError) {
        console.error(
          'Failed to send error notification to Slack:',
          slackError,
        );
      }
    }

    const errorResponse: ReviewHandlerResponse = {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
      newReviewsCount: 0,
      totalReviewsFetched: 0,
      error: error instanceof Error ? error.message : String(error),
    };

    if (error instanceof ValidationException) {
      errorResponse.validationErrors = error.errors.map(e => ({
        field: e.path.join('.') || 'root',
        message: e.message,
      }));
    }

    return JSON.stringify(errorResponse, null, 2);
  }
};

export default reviewHandler;
