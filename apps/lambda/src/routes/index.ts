/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-console */
/* eslint-disable no-shadow */
/* eslint-disable no-case-declarations */

import healthHandler from '@lambda/handlers/health';
import reviewHandler from '@lambda/handlers/reviews';
import versionHandler from '@lambda/handlers/version';
import { analyticsHandler } from '@lambda/handlers/analytics';
import {
  APIGatewayProxyEvent,
  APIGatewayProxyEventQueryStringParameters,
} from 'aws-lambda';

const routes = async (
  path: string,
  _queryParams: APIGatewayProxyEventQueryStringParameters | null,
  _requestUrl: string,
  event?: APIGatewayProxyEvent,
) => {
  let response: unknown;
  let statusCode: number;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,OPTIONS,POST,PUT,PATCH,DELETE',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (event?.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  switch (path) {
    case '/api/reviews': {
      statusCode = 200;
      headers['Content-Type'] = 'application/json';
      response = await reviewHandler(_queryParams);
      break;
    }

    case '/api/analytics': {
      statusCode = 200;
      headers['Content-Type'] = 'application/json';
      response = await analyticsHandler(_queryParams);
      break;
    }

    case '/api/healthcheck': {
      statusCode = 200;
      response = healthHandler();
      break;
    }

    case '/api/version': {
      statusCode = 200;
      response = versionHandler();
      break;
    }

    default:
      response = JSON.stringify({ message: 'route not found' }, null, 2);
      statusCode = 404;
      break;
  }
  return {
    statusCode,
    headers,
    body: response,
  };
};
export default routes;
