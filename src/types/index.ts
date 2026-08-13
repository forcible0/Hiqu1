export type Status = "online" | "idle" | "dnd" | "offline";

export interface User {
  id: string;
  name: string;
  username: string;
  avatar: string;
  status: Status;
  statusText?: string;
  memberSince: string;
}

export interface FriendRequest extends User {
  direction: "incoming" | "outgoing";
}

export interface Server {
  id: string;
  name: string;
  icon: string;
  inviteCode: string;
  ownerId: string;
}

export interface Channel {
  id: string;
  serverId: string;
  name: string;
  type: "text";
}

export interface Message {
  id: string;
  authorId: string;
  content: string;
  timestamp: string;
  embed?: {
    type: "youtube" | "link";
    title: string;
    url: string;
    thumbnail?: string;
  };
}

export type View = "friends" | "dm" | "channel";
export type FriendsTab = "online" | "all" | "pending" | "blocked";

export type ModalType =
  | "addFriend"
  | "createServer"
  | "joinServer"
  | "newDm"
  | "settings"
  | "createChannel"
  | null;
