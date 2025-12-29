import { testSlackService } from '../../services/testSlack';
import { parseWebhookMap } from '../../util/webhookMap';

const testSlackHandler = async (): Promise<string> => {
  try {
    const webhookMap = parseWebhookMap(process.env.APP_SLACK_WEBHOOK_MAP);
    const webhookCount = webhookMap.size;

    if (webhookCount === 0) {
      return JSON.stringify(
        {
          success: false,
          message: 'No Slack webhooks configured in APP_SLACK_WEBHOOK_MAP',
        },
        null,
        2,
      );
    }

    const testReview = testSlackService.createTestReview();
    const processedResults = await testSlackService.testWebhooks(
      webhookMap,
      testReview,
    );
    const successCount = processedResults.filter(r => r.success).length;
    const allSuccess = successCount === processedResults.length;

    return JSON.stringify(
      {
        success: allSuccess,
        message: allSuccess
          ? `Successfully sent test review to ${successCount} webhook(s)`
          : `Sent test review to ${successCount} of ${processedResults.length} webhook(s)`,
        webhookCount,
        results: processedResults,
      },
      null,
      2,
    );
  } catch (error) {
    return JSON.stringify(
      {
        success: false,
        message: 'Error testing Slack connection',
        error: error instanceof Error ? error.message : String(error),
      },
      null,
      2,
    );
  }
};

export default testSlackHandler;
