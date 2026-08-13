export type Status = "online" | "idle" | "dnd" | "offline";
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

export interface User {
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

export interface AccountUser extends User {
  email: string;
  settings: UserSettings;
}

export interface FriendRequest extends User {
  direction: "incoming" | "outgoing";
}

export interface Server {
  id: string;
  name: string;
  icon: string;
  banner?: string;
  description?: string;
  inviteCode: string;
  ownerId: string;
}

export interface Channel {
  id: string;
  serverId: string;
  name: string;
  type: "text";
}

export interface MessageReplyPreview {
  id: string;
  authorId: string;
  authorName: string;
  content: string;
}

export interface MessageReaction {
  emoji: string;
  userIds: string[];
}

export interface Message {
  id: string;
  authorId: string;
  content: string;
  timestamp: string;
  createdAt?: number;
  replyToId?: string;
  replyTo?: MessageReplyPreview;
  embed?: {
    type: "youtube" | "link" | "gif";
    title: string;
    url: string;
    thumbnail?: string;
  };
  reactions?: MessageReaction[];
}

export type ForwardDestination =
  | { type: "dm"; id: string; name: string; avatar?: string }
  | { type: "group"; id: string; name: string; avatar?: string }
  | { type: "channel"; id: string; name: string };

export interface MessageRequest {
  id: string;
  from: User;
  content: string;
  createdAt: number;
}

export interface GroupDm {
  id: string;
  name: string;
  icon: string;
  members: User[];
}

export interface UserProfileDetails {
  user: User;
  mutualServers: Server[];
  mutualFriends: User[];
  friendsSince?: string;
  isFriend: boolean;
}

export type View = "friends" | "dm" | "channel" | "group-dm" | "message-requests";
export type FriendsTab = "online" | "all" | "pending" | "blocked";

export type SettingsTab =
  | "account"
  | "profile"
  | "appearance"
  | "notifications"
  | "privacy"
  | "language"
  | "server-overview"
  | "server-appearance";

export type ModalType =
  | "addFriend"
  | "createServer"
  | "joinServer"
  | "newDm"
  | "newGroupDm"
  | "settings"
  | "createChannel"
  | null;

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
