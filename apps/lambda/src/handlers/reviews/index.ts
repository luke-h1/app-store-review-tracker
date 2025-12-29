import { APIGatewayProxyEventQueryStringParameters } from 'aws-lambda';
import { reviewsService } from '../../services/reviews';
import {
  validateReviewHandlerParams,
  ValidationException,
} from '../../util/validation';
import { parseAppIds } from '../../util/appIds';
import { z } from 'zod';
import type { ReviewHandlerParams, UnifiedReview } from '../../types/reviews';

interface ReviewHandlerResponse {
  success: boolean;
  reviews: Record<string, UnifiedReview[]>;
  count: number;
  error?: string;
  validationErrors?: Array<{ field: string; message: string }>;
}

const reviewHandler = async (
  queryParams: APIGatewayProxyEventQueryStringParameters | null,
): Promise<string> => {
  try {
    const appleAppId = queryParams?.appleAppId;
    const googleAppId = queryParams?.googleAppId;
    const useSingleAppMode = !!(appleAppId || googleAppId);

    const country = queryParams?.country || process.env.COUNTRY || 'gb';
    const limit = queryParams?.limit
      ? parseInt(queryParams.limit, 10)
      : parseInt(process.env.REVIEW_LIMIT || '10', 10);
    const sortBy =
      (queryParams?.sortBy as 'mostRecent' | 'mostHelpful') ||
      (process.env.SORT_BY as 'mostRecent' | 'mostHelpful') ||
      'mostRecent';

    let allReviews: UnifiedReview[];

    if (useSingleAppMode) {
      const params: ReviewHandlerParams = {
        appleAppId,
        googleAppId,
        country,
        limit,
        sortBy,
      };
      validateReviewHandlerParams(params);
      allReviews = await reviewsService.fetchForSingleApp(params);
    } else {
      const appleAppIds = parseAppIds(process.env.APPLE_APP_IDS);
      const googleAppIds = parseAppIds(process.env.GOOGLE_APP_IDS);

      if (appleAppIds.length === 0 && googleAppIds.length === 0) {
        throw new ValidationException([
          {
            code: z.ZodIssueCode.custom,
            message:
              'At least one of appleAppId or googleAppId must be provided via query params or environment variables',
            path: ['appIds'],
          },
        ]);
      }

      allReviews = await reviewsService.fetchForApps(
        appleAppIds,
        googleAppIds,
        {
          country,
          limit,
          sortBy,
        },
      );
    }

    const reviewsByApp: Record<string, UnifiedReview[]> = {};
    for (const review of allReviews) {
      const key = `${review.platform}:${review.appId}`;
      if (!reviewsByApp[key]) {
        reviewsByApp[key] = [];
      }
      reviewsByApp[key].push(review);
    }

    return JSON.stringify(
      {
        success: true,
        reviews: reviewsByApp,
        count: allReviews.length,
      },
      null,
      2,
    );
  } catch (error) {
    console.error('Error in review handler:', error);

    const response: ReviewHandlerResponse = {
      success: false,
      reviews: {},
      count: 0,
      error: error instanceof Error ? error.message : String(error),
    };

    if (error instanceof ValidationException) {
      response.validationErrors = error.errors.map(e => ({
        field: e.path.join('.') || 'root',
        message: e.message,
      }));
    }

    return JSON.stringify(response, null, 2);
  }
};

export default reviewHandler;
