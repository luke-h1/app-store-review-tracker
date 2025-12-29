/* eslint-disable no-console */
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

  const cleanAppId = String(appleAppId)
    .trim()
    .replace(/^["']|["']$/g, '');

  if (!cleanAppId) {
    console.error(`Invalid app ID after cleaning: ${appleAppId}`);
    return [];
  }

  try {
    const url = `https://itunes.apple.com/${country}/rss/customerreviews/id=${cleanAppId}/sortBy=${sortBy}/json?first=${limit}`;
    console.log(`Fetching Apple reviews from: ${url}`);
    const response = await axios.get<AppleReviewResponse>(url);

    console.log(
      `Response status: ${response.status}, has feed: ${!!response.data?.feed}`,
    );
    console.log(
      `Feed has entry field: ${!!response.data?.feed?.entry}, entry type: ${typeof response.data?.feed?.entry}, is array: ${Array.isArray(response.data?.feed?.entry)}`,
    );
    console.log(
      'Response data keys:',
      response.data ? Object.keys(response.data).join(', ') : 'no data',
    );

    const reviews: UnifiedReview[] = [];

    if (response.data?.feed?.entry) {
      const entries = Array.isArray(response.data.feed.entry)
        ? response.data.feed.entry
        : [response.data.feed.entry];

      console.log(`Processing ${entries.length} review entries`);

      for (const entry of entries) {
        try {
          const dateString = entry.updated?.label || new Date().toISOString();

          const review: UnifiedReview = {
            id: entry.id?.label || '',
            platform: 'apple',
            appId: cleanAppId,
            rating: parseInt(entry['im:rating']?.label || '0', 10),
            title: entry.title?.label || '',
            content: entry.content?.label || '',
            author: entry.author?.name?.label || '',
            date: dateString,
            version: entry['im:version']?.label,
            helpful: parseInt(entry['im:voteCount']?.label || '0', 10) || 0,
            createdAt: new Date(dateString).getTime(),
          };
          reviews.push(review);
        } catch (entryError) {
          console.error(
            'Error processing review entry:',
            entryError,
            'Entry data:',
            JSON.stringify(entry, null, 2).substring(0, 200),
          );
        }
      }
    } else {
      console.log(
        `No reviews found in feed for app ID ${cleanAppId}. Full feed structure:`,
        JSON.stringify(response.data?.feed || response.data || {}, null, 2),
      );
    }

    console.log(
      `Fetched ${reviews.length} reviews for Apple app ${cleanAppId}`,
    );
    return reviews;
  } catch (error) {
    console.error('Error fetching Apple reviews:', error);

    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const statusText = error.response?.statusText;
      const cleanAppId = String(appleAppId || '')
        .trim()
        .replace(/^["']|["']$/g, '');
      const message = status
        ? `Failed to fetch Apple reviews for app ID ${cleanAppId} (HTTP ${status} ${statusText})`
        : `Failed to fetch Apple reviews for app ID ${cleanAppId}: ${error.message}`;
      throw new Error(message);
    }

    const cleanAppId = String(appleAppId || '')
      .trim()
      .replace(/^["']|["']$/g, '');
    throw new Error(
      `Failed to fetch Apple reviews for app ID ${cleanAppId}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
};
