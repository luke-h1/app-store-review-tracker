'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';

interface AnalyticsData {
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

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get<AnalyticsData>('/api/analytics');
      setData(response.data);
    } catch (err) {
      const errorMessage = axios.isAxiosError(err)
        ? (err.response?.data as { error?: string })?.error ||
          'Failed to fetch analytics'
        : 'Failed to fetch analytics';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">
            Loading analytics...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="text-red-600 dark:text-red-400 mb-4">
            <svg
              className="w-12 h-12 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Error
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">{error}</p>
          <button
            onClick={() => {
              void fetchAnalytics();
            }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          Review Analytics
        </h1>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Total Reviews
            </h3>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
              {data.totalReviews}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Apps Tracked
            </h3>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
              {data.reviewsByApp.length}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Average Rating
            </h3>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
              {data.reviewsByApp.length > 0
                ? (
                    data.reviewsByApp.reduce(
                      (sum, app) => sum + app.averageRating,
                      0,
                    ) / data.reviewsByApp.length
                  ).toFixed(1)
                : 'N/A'}
            </p>
          </div>
        </div>

        {/* Reviews by App */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-8">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Reviews by App
            </h2>
          </div>
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Platform
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      App ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Reviews
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Avg Rating
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {data.reviewsByApp.map((app, idx) => (
                    <tr key={idx}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white capitalize">
                        {app.platform}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {app.appId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {app.count}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {app.averageRating.toFixed(1)} ⭐
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Reviews by Rating */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-8">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Reviews by Rating
            </h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {Object.entries(data.reviewsByRating)
                .sort((a, b) => parseInt(b[0]) - parseInt(a[0]))
                .map(([rating, count]) => (
                  <div key={rating} className="flex items-center">
                    <div className="w-16 text-sm font-medium text-gray-900 dark:text-white">
                      {rating} ⭐
                    </div>
                    <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-4 mr-4">
                      <div
                        className="bg-indigo-600 h-4 rounded-full"
                        style={{
                          width: `${(count / data.totalReviews) * 100}%`,
                        }}
                      ></div>
                    </div>
                    <div className="w-16 text-sm text-gray-600 dark:text-gray-400 text-right">
                      {count}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* Recent Reviews */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Recent Reviews
            </h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {data.recentReviews.map(review => (
                <div
                  key={review.reviewId}
                  className="border-b border-gray-200 dark:border-gray-700 pb-4 last:border-0"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                          {review.platform}
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {review.appId}
                        </span>
                        <span className="text-sm text-yellow-500">
                          {'⭐'.repeat(review.rating)}
                        </span>
                      </div>
                      {review.title && (
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                          {review.title}
                        </h3>
                      )}
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                        {review.author}
                      </p>
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(review.date).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
