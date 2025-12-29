export interface AppleReviewEntry {
  id: {
    label: string;
  };
  'im:version': {
    label: string;
  };
  'im:rating': {
    label: string;
  };
  title: {
    label: string;
  };
  content: {
    label: string;
  };
  link: {
    attributes: {
      rel: string;
      href: string;
    };
  };
  author: {
    uri: {
      label: string;
    };
    name: {
      label: string;
    };
    label: string;
  };
  'im:voteSum': {
    label: string;
  };
  'im:contentType': {
    attributes: {
      term: string;
      label: string;
    };
  };
  'im:voteCount': {
    label: string;
  };
}

export interface AppleReviewFeed {
  author: {
    name: {
      label: string;
    };
    uri: {
      label: string;
    };
  };
  updated: {
    label: string;
  };
  rights: {
    label: string;
  };
  title: {
    label: string;
  };
  icon: {
    label: string;
  };
  link: Array<{
    attributes: {
      rel: string;
      type?: string;
      href: string;
    };
  }>;
  id: {
    label: string;
  };
  entry?: AppleReviewEntry[];
}

export interface AppleReviewResponse {
  feed: AppleReviewFeed;
}

export interface GoogleReview {
  reviewId: string;
  userName: string;
  userImage?: string;
  content: string;
  score: number;
  thumbsUp: number;
  reviewCreatedVersion?: string;
  at: number; // timestamp
  replyContent?: string;
  repliedAt?: number;
}

export interface GoogleReviewResponse {
  reviews: GoogleReview[];
  nextPaginationToken?: string;
}

export interface UnifiedReview {
  id: string;
  platform: 'apple' | 'google';
  appId: string;
  rating: number;
  title: string;
  content: string;
  author: string;
  date: string;
  version?: string;
  helpful?: number;
  createdAt: number;
}

export interface ReviewHandlerParams {
  appleAppId?: string;
  googleAppId?: string;
  country?: string; // For Apple reviews (e.g., 'gb', 'us')
  limit?: number;
  sortBy?: 'mostRecent' | 'mostHelpful';
}

// DynamoDB Review Item
export interface ReviewItem {
  reviewId: string;
  platform: string;
  appId: string;
  rating: number;
  title: string;
  content: string;
  author: string;
  date: string;
  version?: string;
  helpful?: number;
  createdAt: number;
  ttl?: number; // For automatic cleanup of old reviews
}
