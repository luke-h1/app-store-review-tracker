import { fetchAppleReviews } from './appleReviews';
import { fetchGoogleReviews } from './googleReviews';
import type { ReviewHandlerParams, UnifiedReview } from '../types/reviews';

export const reviewsService = {
  fetchForPlatform: async (
    params: ReviewHandlerParams,
    platform: 'apple' | 'google',
  ): Promise<UnifiedReview[]> => {
    const fetchFn =
      platform === 'apple' ? fetchAppleReviews : fetchGoogleReviews;
    try {
      return await fetchFn(params);
    } catch (error) {
      console.error(`Error fetching ${platform} reviews:`, error);
      return [];
    }
  },

  fetchForApps: async (
    appleAppIds: string[],
    googleAppIds: string[],
    params: Omit<ReviewHandlerParams, 'appleAppId' | 'googleAppId'>,
  ): Promise<UnifiedReview[]> => {
    const fetchTasks = [
      ...appleAppIds.map(appId =>
        reviewsService.fetchForPlatform(
          { ...params, appleAppId: appId },
          'apple',
        ),
      ),
      ...googleAppIds.map(appId =>
        reviewsService.fetchForPlatform(
          { ...params, googleAppId: appId },
          'google',
        ),
      ),
    ];

    const results = await Promise.all(fetchTasks);
    return results.flat();
  },

  fetchForSingleApp: async (
    params: ReviewHandlerParams,
  ): Promise<UnifiedReview[]> => {
    const [appleReviews, googleReviews] = await Promise.all([
      reviewsService.fetchForPlatform(params, 'apple'),
      reviewsService.fetchForPlatform(params, 'google'),
    ]);
    return [...appleReviews, ...googleReviews];
  },
};
