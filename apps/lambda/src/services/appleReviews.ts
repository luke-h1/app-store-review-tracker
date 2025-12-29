import axios from 'axios';
import type {
  AppleReviewResponse,
  UnifiedReview,
  ReviewHandlerParams,
} from '../types/reviews';

export const fetchAppleReviews = async (
  params: ReviewHandlerParams,
): Promise<UnifiedReview[]> => {
  const {
    appleAppId = '1345907668',
    country = 'gb',
    limit = 10,
    sortBy = 'mostRecent',
  } = params;

  if (!appleAppId) {
    return [];
  }

  try {
    const url = `https://itunes.apple.com/${country}/rss/customerreviews/id=${appleAppId}/sortBy=${sortBy}/json?first=${limit}`;
    const response = await axios.get<AppleReviewResponse>(url);

    const reviews: UnifiedReview[] = [];

    if (response.data.feed.entry) {
      for (const entry of response.data.feed.entry) {
        const dateString =
          response.data.feed.updated?.label || new Date().toISOString();

        const review: UnifiedReview = {
          id: entry.id.label,
          platform: 'apple',
          appId: appleAppId,
          rating: parseInt(entry['im:rating'].label, 10),
          title: entry.title.label,
          content: entry.content.label,
          author: entry.author.name.label,
          date: dateString,
          version: entry['im:version'].label,
          helpful: parseInt(entry['im:voteCount'].label, 10) || 0,
          createdAt: new Date(dateString).getTime(),
        };
        reviews.push(review);
      }
    }

    return reviews;
  } catch (error) {
    console.error('Error fetching Apple reviews:', error);

    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const statusText = error.response?.statusText;
      const message = status
        ? `Failed to fetch Apple reviews for app ID ${appleAppId} (HTTP ${status} ${statusText})`
        : `Failed to fetch Apple reviews for app ID ${appleAppId}: ${error.message}`;
      throw new Error(message);
    }

    throw new Error(
      `Failed to fetch Apple reviews for app ID ${appleAppId}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
};
