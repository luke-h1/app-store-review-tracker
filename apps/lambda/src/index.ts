/* eslint-disable no-console */
import {
  APIGatewayProxyEvent,
  Context,
  EventBridgeEvent,
  Handler,
} from 'aws-lambda';
import routes from './routes';
import lambdaTimeout from './util/lambdaTimeout';
import { scheduledReviewHandler } from './handlers/reviews/scheduled';

const isEventBridgeEvent = (event: unknown): boolean => {
  return (
    typeof event === 'object' &&
    event !== null &&
    'source' in event &&
    'detail-type' in event
  );
};

export const handler: Handler = async (
  event: APIGatewayProxyEvent | EventBridgeEvent<'Scheduled Event', unknown>,
  context: Context,
) => {
  if (isEventBridgeEvent(event)) {
    try {
      const eventBridgeEvent = event as EventBridgeEvent<
        'Scheduled Event',
        unknown
      >;

      await scheduledReviewHandler(eventBridgeEvent);

      return { statusCode: 200, body: 'Review check completed' };
    } catch (error) {
      console.error('Error in scheduled handler:', error);
      throw error;
    }
  }

  const apiEvent = event as APIGatewayProxyEvent;
  const { path } = apiEvent;

  const { queryStringParameters } = apiEvent;

  const queryString = new URLSearchParams(
    queryStringParameters as unknown as string,
  ).toString();

  const host = apiEvent.headers?.Host ?? apiEvent.headers?.host ?? 'unknown';
  const url = `https://${host}${apiEvent.path}?${queryString}`;

  console.info('origin url ->', url);

  try {
    return await Promise.race([
      routes(path, queryStringParameters, url, apiEvent),
      lambdaTimeout(context),
    ]).then(value => value);
  } catch (e) {
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        error: e instanceof Error ? e.message : 'Unknown error',
      }),
    };
  }
};
