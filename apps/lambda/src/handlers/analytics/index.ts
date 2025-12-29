import { APIGatewayProxyEventQueryStringParameters } from 'aws-lambda';
import { dynamodbService } from '../../services/dynamodb';

interface AnalyticsResponse {
  totalReviews: number;
  reviewsByApp: Array<{
    appId: string;
    platform: string;
    count: number;
    averageRating: number;
  }>;
  reviewsByRating: Record<string, number>;
  recentReviews: Array<{
    reviewId: string;
    platform: string;
    appId: string;
    rating: number;
    title: string;
    author: string;
    date: number;
  }>;
}

export const analyticsHandler = async (
  queryParams: APIGatewayProxyEventQueryStringParameters | null,
): Promise<string> => {
  try {
    const appId = queryParams?.appId;
    const platform = queryParams?.platform;
    const limit = queryParams?.limit ? parseInt(queryParams.limit, 10) : 1000;

    const reviews = appId
      ? await dynamodbService.getReviewsByAppId(appId, platform, limit)
      : await dynamodbService.getAllReviews(limit);

    const reviewsByApp = new Map<
      string,
      { appId: string; platform: string; count: number; totalRating: number }
    >();

    const reviewsByRating: Record<string, number> = {};
    const recentReviews = reviews
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 50)
      .map(review => ({
        reviewId: review.reviewId,
        platform: review.platform,
        appId: review.appId,
        rating: review.rating,
        title: review.title || '',
        author: review.author || '',
        date: new Date(review.date).getTime(),
      }));

    for (const review of reviews) {
      const key = `${review.platform}#${review.appId}`;
      const existing = reviewsByApp.get(key);
      if (existing) {
        existing.count++;
        existing.totalRating += review.rating;
      } else {
        reviewsByApp.set(key, {
          appId: review.appId,
          platform: review.platform,
          count: 1,
          totalRating: review.rating,
        });
      }

      const ratingKey = review.rating.toString();
      reviewsByRating[ratingKey] = (reviewsByRating[ratingKey] || 0) + 1;
    }

    const response: AnalyticsResponse = {
      totalReviews: reviews.length,
      reviewsByApp: Array.from(reviewsByApp.values()).map(app => ({
        appId: app.appId,
        platform: app.platform,
        count: app.count,
        averageRating: app.totalRating / app.count,
      })),
      reviewsByRating,
      recentReviews,
    };

    return JSON.stringify(response, null, 2);
  } catch (error) {
    console.error('Error in analytics handler:', error);
    return JSON.stringify(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      null,
      2,
    );
  }
};
