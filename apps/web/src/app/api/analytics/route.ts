import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const LAMBDA_API_URL = process.env.LAMBDA_API_URL || '';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const apiKey = request.headers.get('x-api-key');

    const params: Record<string, string> = {};
    if (searchParams.get('appId')) {
      params.appId = searchParams.get('appId')!;
    }
    if (searchParams.get('platform')) {
      params.platform = searchParams.get('platform')!;
    }
    if (searchParams.get('limit')) {
      params.limit = searchParams.get('limit')!;
    }

    const headers: Record<string, string> = {};
    if (apiKey) {
      headers['x-api-key'] = apiKey;
    }

    const response = await axios.get(`${LAMBDA_API_URL}/api/analytics`, {
      params,
      headers,
    });

    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error fetching analytics:', error);
    if (axios.isAxiosError(error)) {
      return NextResponse.json(
        {
          error: error.response?.data?.error || 'Failed to fetch analytics',
        },
        { status: error.response?.status || 500 },
      );
    }
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 },
    );
  }
}
