export const parseWebhookMap = (envVar?: string): Map<string, string[]> => {
  const webhookMap = new Map<string, string[]>();

  if (!envVar) return webhookMap;

  try {
    const parsed = JSON.parse(envVar) as Record<string, string>;
    for (const [key, url] of Object.entries(parsed)) {
      const trimmedUrl = url?.trim();
      if (trimmedUrl) {
        webhookMap.set(key.trim(), [trimmedUrl]);
      }
    }
  } catch (error) {
    console.error('Error parsing webhook map:', error);
  }

  return webhookMap;
};

export const getUniqueWebhooks = (
  webhookMap: Map<string, string[]>,
): Set<string> => {
  const unique = new Set<string>();
  for (const urls of webhookMap.values()) {
    for (const url of urls) {
      if (url?.trim()) {
        unique.add(url.trim());
      }
    }
  }
  return unique;
};
