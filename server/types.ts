export type Status = "online" | "idle" | "dnd" | "offline";
export type FriendshipStatus = "pending" | "accepted" | "blocked";
export type Theme = "dark" | "light" | "ash" | "onyx" | "midnight";
export type Language = "tr" | "en";

export interface UserSettings {
  theme: Theme;
  language: Language;
  soundEnabled: boolean;
  soundVolume: number;
  notifyDm: boolean;
  notifyFriends: boolean;
  notifyServer: boolean;
  notifyMention: boolean;
  privacyShowStatus: boolean;
  privacyAllowFriendRequests: boolean;
  privacyShowEmail: boolean;
}

export interface MessageEmbed {
  type: "youtube" | "link" | "gif";
  title: string;
  url: string;
  thumbnail?: string;
}

export interface MessageRequestInfo {
  id: string;
  from: PublicUser;
  content: string;
  createdAt: number;
}

export interface GroupDmInfo {
  id: string;
  name: string;
  icon: string;
  members: PublicUser[];
}

export interface UserProfileInfo {
  user: PublicUser;
  mutualServers: ServerInfo[];
  mutualFriends: PublicUser[];
  friendsSince?: string;
  isFriend: boolean;
}

export interface PublicUser {
  id: string;
  name: string;
  username: string;
  avatar: string;
  banner?: string;
  bio?: string;
  accentColor?: string;
  status: Status;
  statusText?: string;
  memberSince: string;
}

export interface AccountUser extends PublicUser {
  email: string;
  settings: UserSettings;
}

export interface FriendRequestInfo extends PublicUser {
  direction: "incoming" | "outgoing";
}

export interface ServerInfo {
  id: string;
  name: string;
  icon: string;
  banner?: string;
  description?: string;
  inviteCode: string;
  ownerId: string;
}

export interface ChannelInfo {
  id: string;
  serverId: string;
  name: string;
  type: "text";
}

export interface MessageReaction {
  emoji: string;
  userIds: string[];
}

export interface ChatMessage {
  id: string;
  authorId: string;
  content: string;
  timestamp: string;
  createdAt: number;
  replyToId?: string;
  replyTo?: {
    id: string;
    authorId: string;
    authorName: string;
    content: string;
  };
  embed?: MessageEmbed;
  reactions?: MessageReaction[];
}

export function defaultUserSettings(): UserSettings {
  return {
    theme: "midnight",
    language: "tr",
    soundEnabled: true,
    soundVolume: 70,
    notifyDm: true,
    notifyFriends: true,
    notifyServer: true,
    notifyMention: true,
    privacyShowStatus: true,
    privacyAllowFriendRequests: true,
    privacyShowEmail: false,
  };
}

export const VALID_THEMES: Theme[] = ["dark", "light", "ash", "onyx", "midnight"];
