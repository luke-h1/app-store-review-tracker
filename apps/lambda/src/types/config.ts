export interface AppConfig {
  appleAppIds?: string[];
  googleAppIds?: string[];
  country?: string;
  limit?: number;
  sortBy?: 'mostRecent' | 'mostHelpful';
}

export interface ReviewCheckEvent {
  appleAppIds?: string[];
  googleAppIds?: string[];
  country?: string;
  limit?: number;
  sortBy?: 'mostRecent' | 'mostHelpful';
}
