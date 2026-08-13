import type { UserSettings } from "./types.js";
import { defaultUserSettings } from "./types.js";

export function migrateDatabase(parsed: Record<string, unknown>) {
  const users = ((parsed.users as Record<string, unknown>[]) ?? []).map((u) => ({
    ...u,
    banner: (u.banner as string) ?? "",
    bio: (u.bio as string) ?? "",
    accentColor: (u.accentColor as string) ?? "#3fb9b6",
    settings: (u.settings as UserSettings) ?? defaultUserSettings(),
  }));

  const servers = ((parsed.servers as Record<string, unknown>[]) ?? []).map((s) => ({
    ...s,
    banner: (s.banner as string) ?? "",
    description: (s.description as string) ?? "",
  }));

  const base = {
    version: 3 as number,
    users,
    friendships: parsed.friendships ?? [],
    servers,
    serverMembers: parsed.serverMembers ?? [],
    channels: parsed.channels ?? [],
    dmMessages: parsed.dmMessages ?? [],
    channelMessages: parsed.channelMessages ?? [],
  };

  return migrateToV4(base);
}

export function migrateToV4(db: Record<string, unknown>) {
  return migrateToV5({
    ...db,
    version: 4,
    dmContacts: db.dmContacts ?? [],
    messageRequests: db.messageRequests ?? [],
    groupDms: db.groupDms ?? [],
    groupDmMembers: db.groupDmMembers ?? [],
    groupDmMessages: db.groupDmMessages ?? [],
  });
}

export function migrateToV5(db: Record<string, unknown>) {
  return migrateToV6({
    ...db,
    version: 5,
  });
}

export function migrateToV6(db: Record<string, unknown>) {
  return {
    ...db,
    version: 6,
    pinnedMessages: db.pinnedMessages ?? [],
  };
}
