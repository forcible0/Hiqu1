export interface ServerMemberSettings {
  muteUntil: number | null;
  allowDms: boolean;
  filterMessageRequests: boolean;
  shareActivity: boolean;
  allowActivityJoin: boolean;
}

const DEFAULT: ServerMemberSettings = {
  muteUntil: null,
  allowDms: true,
  filterMessageRequests: true,
  shareActivity: false,
  allowActivityJoin: false,
};

function key(serverId: string, userId: string) {
  return `hiqu-server-settings-${userId}-${serverId}`;
}

export function getServerMemberSettings(serverId: string, userId: string): ServerMemberSettings {
  try {
    const raw = localStorage.getItem(key(serverId, userId));
    if (!raw) return { ...DEFAULT };
    return { ...DEFAULT, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT };
  }
}

export function saveServerMemberSettings(
  serverId: string,
  userId: string,
  settings: Partial<ServerMemberSettings>,
) {
  const next = { ...getServerMemberSettings(serverId, userId), ...settings };
  localStorage.setItem(key(serverId, userId), JSON.stringify(next));
  return next;
}

export function isServerMuted(serverId: string, userId: string): boolean {
  const { muteUntil } = getServerMemberSettings(serverId, userId);
  if (muteUntil === null) return false;
  if (muteUntil === -1) return true;
  if (muteUntil > Date.now()) return true;
  saveServerMemberSettings(serverId, userId, { muteUntil: null });
  return false;
}

export const MUTE_OPTIONS = [
  { label: "15 dakika", ms: 15 * 60 * 1000 },
  { label: "1 saat", ms: 60 * 60 * 1000 },
  { label: "3 saat", ms: 3 * 60 * 60 * 1000 },
  { label: "8 saat", ms: 8 * 60 * 60 * 1000 },
  { label: "24 saat", ms: 24 * 60 * 60 * 1000 },
  { label: "Sınırsız", ms: -1 },
] as const;
