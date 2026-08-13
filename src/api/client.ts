import type { Channel, FriendRequest, Message, Server, Status, User } from "../types";

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
  return publicPost<{ token: string; user: User }>("/auth/register", data);
}

export async function login(login: string, password: string) {
  return publicPost<{ token: string; user: User }>("/auth/login", { login, password });
}

export async function logout(token: string) {
  return authed("/auth/logout", token, { method: "POST" });
}

export async function fetchMe(token: string) {
  return authed<User>("/auth/me", token);
}

export async function updateProfile(
  token: string,
  data: { statusText?: string; status?: Status; name?: string },
) {
  return authed<User>("/users/me", token, { method: "PATCH", body: JSON.stringify(data) });
}

export async function searchUsers(token: string, q: string) {
  return authed<User[]>(`/users/search?q=${encodeURIComponent(q)}`, token);
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

export type { Status };
