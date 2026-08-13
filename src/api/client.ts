import type {
  AccountUser,
  Channel,
  FriendRequest,
  GroupDm,
  Message,
  MessageRequest,
  Server,
  Status,
  User,
  UserProfileDetails,
  UserSettings,
} from "../types";

const API = "/api";

function authHeaders(token: string) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

async function authed<T>(path: string, token: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: { ...authHeaders(token), ...init?.headers },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((err as { error?: string }).error ?? "İstek başarısız");
  }
  return res.json() as Promise<T>;
}

async function publicPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "İstek başarısız" }));
    throw new Error((err as { error?: string }).error ?? "İstek başarısız");
  }
  return res.json() as Promise<T>;
}

export async function register(data: {
  email: string;
  username: string;
  password: string;
  displayName: string;
}) {
  return publicPost<{ token: string; user: AccountUser }>("/auth/register", data);
}

export async function login(login: string, password: string) {
  return publicPost<{ token: string; user: AccountUser }>("/auth/login", { login, password });
}

export async function logout(token: string) {
  return authed("/auth/logout", token, { method: "POST" });
}

export async function fetchMe(token: string) {
  return authed<AccountUser>("/auth/me", token);
}

export async function updateProfile(
  token: string,
  data: {
    statusText?: string;
    status?: Status;
    name?: string;
    avatar?: string;
    banner?: string;
    bio?: string;
    accentColor?: string;
  },
) {
  return authed<AccountUser>("/users/me", token, { method: "PATCH", body: JSON.stringify(data) });
}

export async function uploadProfileImage(
  token: string,
  kind: "avatar" | "banner",
  dataUrl: string,
) {
  return authed<AccountUser>("/users/me/upload", token, {
    method: "POST",
    body: JSON.stringify({ kind, dataUrl }),
  });
}

export async function updateSettings(token: string, settings: Partial<UserSettings>) {
  return authed<AccountUser>("/users/me/settings", token, {
    method: "PATCH",
    body: JSON.stringify(settings),
  });
}

export async function changePassword(token: string, currentPassword: string, newPassword: string) {
  return authed("/users/me/password", token, {
    method: "POST",
    body: JSON.stringify({ currentPassword, newPassword }),
  });
}

export async function deleteAccount(token: string, password: string) {
  return authed("/users/me", token, {
    method: "DELETE",
    body: JSON.stringify({ password }),
  });
}

export async function searchUsers(token: string, q: string) {
  return authed<User[]>(`/users/search?q=${encodeURIComponent(q)}`, token);
}

export async function fetchUserProfile(token: string, userId: string) {
  return authed<UserProfileDetails>(`/users/${userId}/profile`, token);
}

export async function fetchFriends(token: string) {
  return authed<User[]>("/friends", token);
}

export async function fetchPending(token: string) {
  return authed<FriendRequest[]>("/friends/pending", token);
}

export async function fetchBlocked(token: string) {
  return authed<User[]>("/friends/blocked", token);
}

export async function sendFriendRequest(token: string, username: string) {
  return authed<User>("/friends/request", token, {
    method: "POST",
    body: JSON.stringify({ username }),
  });
}

export async function acceptFriend(token: string, userId: string) {
  return authed<User>("/friends/accept", token, {
    method: "POST",
    body: JSON.stringify({ userId }),
  });
}

export async function declineFriend(token: string, userId: string) {
  return authed("/friends/decline", token, {
    method: "POST",
    body: JSON.stringify({ userId }),
  });
}

export async function cancelFriendRequest(token: string, userId: string) {
  return authed("/friends/cancel", token, {
    method: "POST",
    body: JSON.stringify({ userId }),
  });
}

export async function blockUser(token: string, userId: string) {
  return authed("/friends/block", token, {
    method: "POST",
    body: JSON.stringify({ userId }),
  });
}

export async function unblockUser(token: string, userId: string) {
  return authed("/friends/unblock", token, {
    method: "POST",
    body: JSON.stringify({ userId }),
  });
}

export async function removeFriend(token: string, friendId: string) {
  return authed(`/friends/${friendId}`, token, { method: "DELETE" });
}

export async function fetchServers(token: string) {
  return authed<Server[]>("/servers", token);
}

export async function createServer(token: string, name: string) {
  return authed<Server>("/servers", token, {
    method: "POST",
    body: JSON.stringify({ name }),
  });
}

export async function joinServer(token: string, inviteCode: string) {
  return authed<Server>("/servers/join", token, {
    method: "POST",
    body: JSON.stringify({ inviteCode }),
  });
}

export async function leaveServer(token: string, serverId: string) {
  return authed<{ ok: true }>(`/servers/${serverId}/leave`, token, { method: "POST" });
}

export async function uploadServerImage(
  token: string,
  serverId: string,
  kind: "icon" | "banner",
  dataUrl: string,
) {
  return authed<Server>(`/servers/${serverId}/upload`, token, {
    method: "POST",
    body: JSON.stringify({ kind, dataUrl }),
  });
}

export async function updateServer(
  token: string,
  serverId: string,
  data: { name?: string; icon?: string; banner?: string; description?: string },
) {
  return authed<Server>(`/servers/${serverId}`, token, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function regenerateServerInvite(token: string, serverId: string) {
  return authed<Server>(`/servers/${serverId}/invite/regenerate`, token, { method: "POST" });
}

export async function fetchChannels(token: string, serverId: string) {
  return authed<Channel[]>(`/servers/${serverId}/channels`, token);
}

export async function createChannel(token: string, serverId: string, name: string) {
  return authed<Channel>(`/servers/${serverId}/channels`, token, {
    method: "POST",
    body: JSON.stringify({ name }),
  });
}

export async function fetchServerMembers(token: string, serverId: string) {
  return authed<User[]>(`/servers/${serverId}/members`, token);
}

export async function fetchChannelMessages(token: string, channelId: string) {
  return authed<Message[]>(`/channels/${channelId}/messages`, token);
}

export async function fetchDmPartners(token: string) {
  return authed<User[]>("/dms", token);
}

export async function fetchDmMessages(token: string, partnerId: string) {
  return authed<Message[]>(`/messages/${partnerId}`, token);
}

export async function fetchMessageRequests(token: string) {
  return authed<MessageRequest[]>("/message-requests", token);
}

export async function acceptMessageRequest(token: string, requestId: string) {
  return authed<{ partnerId: string; message: Message }>(`/message-requests/${requestId}/accept`, token, {
    method: "POST",
  });
}

export async function declineMessageRequest(token: string, requestId: string) {
  return authed(`/message-requests/${requestId}/decline`, token, {
    method: "POST",
  });
}

export async function fetchGroupDms(token: string) {
  return authed<GroupDm[]>("/group-dms", token);
}

export async function createGroupDm(token: string, memberIds: string[], name?: string) {
  return authed<GroupDm>("/group-dms", token, {
    method: "POST",
    body: JSON.stringify({ memberIds, name }),
  });
}

export async function fetchGroupDmMessages(token: string, groupId: string) {
  return authed<Message[]>(`/group-dms/${groupId}/messages`, token);
}

export async function fetchChatPins(token: string, chatId: string) {
  return authed<{ pinnedIds: string[] }>(`/chats/${encodeURIComponent(chatId)}/pins`, token);
}

export async function pinChatMessage(token: string, chatId: string, messageId: string) {
  return authed<{ pinnedIds: string[] }>(`/chats/${encodeURIComponent(chatId)}/pins`, token, {
    method: "POST",
    body: JSON.stringify({ messageId }),
  });
}

export async function unpinChatMessage(token: string, chatId: string, messageId: string) {
  return authed<{ pinnedIds: string[] }>(
    `/chats/${encodeURIComponent(chatId)}/pins/${encodeURIComponent(messageId)}`,
    token,
    { method: "DELETE" },
  );
}

export async function toggleMessageReaction(
  token: string,
  chatId: string,
  messageId: string,
  emoji: string,
) {
  return authed<{ reactions: { emoji: string; userIds: string[] }[] }>(
    `/chats/${encodeURIComponent(chatId)}/messages/${encodeURIComponent(messageId)}/reactions`,
    token,
    { method: "POST", body: JSON.stringify({ emoji }) },
  );
}

export interface GifItem {
  id: string;
  title: string;
  url: string;
  previewUrl: string;
  width: number;
  height: number;
}

function readStoredToken() {
  return localStorage.getItem("hiqu_token") ?? sessionStorage.getItem("hiqu_session_token");
}

export async function fetchTrendingGifs() {
  const token = readStoredToken();
  if (!token) throw new Error("Oturum gerekli");
  return authed<GifItem[]>("/gifs/trending", token);
}

export async function searchGifs(query: string) {
  const token = readStoredToken();
  if (!token) throw new Error("Oturum gerekli");
  const q = encodeURIComponent(query.trim());
  return authed<GifItem[]>(`/gifs/search?q=${q}`, token);
}

export type { Status };
