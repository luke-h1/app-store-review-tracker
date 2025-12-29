import {
  DynamoDBClient,
  PutItemCommand,
  GetItemCommand,
  ScanCommand,
} from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import type { ReviewItem, UnifiedReview } from '../types/reviews';

const dynamoClient = new DynamoDBClient({
  region: process.env.AWS_REGION || 'eu-west-2',
});

const TABLE_NAME = process.env.REVIEWS_TABLE_NAME || 'app-store-reviews';

export const getReviewId = (
  platform: string,
  appId: string,
  reviewId: string,
): string => {
  return `${platform}#${appId}#${reviewId}`;
};

export const storeReview = async (
  review: UnifiedReview,
  reviewIdentifier: string,
): Promise<void> => {
  const reviewItem: ReviewItem = {
    reviewId: reviewIdentifier,
    platform: review.platform,
    appId: review.appId,
    rating: review.rating,
    title: review.title,
    content: review.content,
    author: review.author,
    date: review.date,
    version: review.version,
    helpful: review.helpful,
    createdAt: review.createdAt,
    ttl: Math.floor(Date.now() / 1000) + 90 * 24 * 60 * 60,
  };

  try {
    await dynamoClient.send(
      new PutItemCommand({
        TableName: TABLE_NAME,
        Item: marshall(reviewItem),
      }),
    );
  } catch (error) {
    console.error('Error storing review:', error);
    throw error;
  }
};

export const reviewExists = async (
  reviewIdentifier: string,
): Promise<boolean> => {
  try {
    const result = await dynamoClient.send(
      new GetItemCommand({
        TableName: TABLE_NAME,
        Key: marshall({
          reviewId: reviewIdentifier,
        }),
      }),
    );

    return !!result.Item;
  } catch (error) {
    console.error('Error checking review existence:', error);
    return false;
  }
};

export const getNewReviews = async (
  reviews: UnifiedReview[],
  reviewIdentifier: string,
): Promise<UnifiedReview[]> => {
  const exists = await reviewExists(reviewIdentifier);
  if (exists) {
    return [];
  }
  return reviews;
};

// Get all reviews for analytics
export const getAllReviews = async (
  limit: number = 1000,
): Promise<ReviewItem[]> => {
  try {
    const result = await dynamoClient.send(
      new ScanCommand({
        TableName: TABLE_NAME,
        Limit: limit,
      }),
    );

    if (!result.Items) {
      return [];
    }

    return result.Items.map(item => unmarshall(item) as ReviewItem);
  } catch (error) {
    console.error('Error getting all reviews:', error);
    throw error;
  }
};

// Get reviews by app ID
export const getReviewsByAppId = async (
  appId: string,
  platform?: string,
  limit: number = 100,
): Promise<ReviewItem[]> => {
  try {
    const result = await dynamoClient.send(
      new ScanCommand({
        TableName: TABLE_NAME,
        FilterExpression: platform
          ? 'appId = :appId AND platform = :platform'
          : 'appId = :appId',
        ExpressionAttributeValues: marshall(
          platform
            ? {
                ':appId': appId,
                ':platform': platform,
              }
            : {
                ':appId': appId,
              },
        ) as Record<string, unknown>,
        Limit: limit,
      }),
    );

    if (!result.Items) {
      return [];
    }

    return result.Items.map(item => unmarshall(item) as ReviewItem);
  } catch (error) {
    console.error('Error getting reviews by app ID:', error);
    throw error;
  }
};
