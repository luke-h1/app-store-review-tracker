import {
  sendTestNotification,
  type Channel,
} from '../../services/notifications';

const testNotificationHandler = async (channel: Channel): Promise<string> => {
  const result = await sendTestNotification(channel);

  if (!result.configured) {
    return JSON.stringify(
      {
        success: false,
        message: `No ${channel} notification target is configured`,
      },
      null,
      2,
    );
  }

  return JSON.stringify(
    {
      success: result.success,
      message: result.success
        ? `Successfully sent test review to ${channel}`
        : `Failed to send test review to ${channel}`,
      error: result.error,
    },
    null,
    2,
  );
};

export default testNotificationHandler;
