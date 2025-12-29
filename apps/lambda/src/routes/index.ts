import healthHandler from '@lambda/handlers/health';
import reviewHandler from '@lambda/handlers/reviews';
import versionHandler from '@lambda/handlers/version';
import { analyticsHandler } from '@lambda/handlers/analytics';
import triggerReviewHandler from '@lambda/handlers/reviews/trigger';
import testSlackHandler from '@lambda/handlers/test-slack';
import {
  APIGatewayProxyEvent,
  APIGatewayProxyEventQueryStringParameters,
} from 'aws-lambda';

const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,OPTIONS,POST,PUT,PATCH,DELETE',
  'Access-Control-Allow-Headers': 'Content-Type',
} as const;

const requirePost = (method?: string) => {
  if (method !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed. Use POST.' }, null, 2),
    };
  }
  return null;
};

const routes = async (
  path: string,
  queryParams: APIGatewayProxyEventQueryStringParameters | null,
  _requestUrl: string,
  event?: APIGatewayProxyEvent,
) => {
  if (event?.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: DEFAULT_HEADERS, body: '' };
  }

  const headers = { ...DEFAULT_HEADERS };

  switch (path) {
    case '/api/reviews':
      return {
        statusCode: 200,
        headers,
        body: await reviewHandler(queryParams),
      };

    case '/api/trigger': {
      const methodError = requirePost(event?.httpMethod);
      if (methodError) return { ...methodError, headers };
      return {
        statusCode: 200,
        headers,
        body: await triggerReviewHandler(),
      };
    }

    case '/api/analytics':
      return {
        statusCode: 200,
        headers,
        body: await analyticsHandler(queryParams),
      };

    case '/api/healthcheck':
      return {
        statusCode: 200,
        headers,
        body: healthHandler(),
      };

    case '/api/version':
      return {
        statusCode: 200,
        headers,
        body: versionHandler(),
      };

    case '/api/test-slack': {
      const methodError = requirePost(event?.httpMethod);
      if (methodError) return { ...methodError, headers };
      return {
        statusCode: 200,
        headers,
        body: await testSlackHandler(),
      };
    }

    default:
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ message: 'route not found' }, null, 2),
      };
  }
};

export default routes;
