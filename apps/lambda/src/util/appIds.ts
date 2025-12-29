export const parseAppIds = (envVar?: string): string[] => {
  if (!envVar) return [];
  return envVar
    .split(',')
    .map(id => id.trim().replace(/^["']|["']$/g, ''))
    .filter(Boolean);
};
