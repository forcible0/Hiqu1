export type Status = "online" | "idle" | "dnd" | "offline";
export type FriendshipStatus = "pending" | "accepted" | "blocked";

export interface MessageEmbed {
  type: "youtube" | "link";
  title: string;
  url: string;
  thumbnail?: string;
}

export interface PublicUser {
  id: string;
  name: string;
  username: string;
  avatar: string;
  status: Status;
  statusText?: string;
  memberSince: string;
}

export interface FriendRequestInfo extends PublicUser {
  direction: "incoming" | "outgoing";
}

export interface ServerInfo {
  id: string;
  name: string;
  icon: string;
  inviteCode: string;
  ownerId: string;
}

export interface ChannelInfo {
  id: string;
  serverId: string;
  name: string;
  type: "text";
}

export interface ChatMessage {
  id: string;
  authorId: string;
  content: string;
  timestamp: string;
  createdAt: number;
  embed?: MessageEmbed;
}
