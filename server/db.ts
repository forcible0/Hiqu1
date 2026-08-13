import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import {
  avatarUrl,
  generateInviteCode,
  hashPassword,
  serverIconUrl,
  validateDisplayName,
  validateEmail,
  validatePassword,
  validateUsername,
  verifyPassword,
} from "./auth.js";
import type {
  ChannelInfo,
  ChatMessage,
  FriendRequestInfo,
  FriendshipStatus,
  MessageEmbed,
  PublicUser,
  ServerInfo,
  Status,
} from "./types.js";
import { detectEmbed, formatTimestamp } from "./utils.js";

const DB_VERSION = 2;
const DB_PATH = join(process.cwd(), "data", "db.json");

interface UserRecord {
  id: string;
  email: string;
  username: string;
  passwordHash: string;
  name: string;
  avatar: string;
  status: Status;
  statusText: string;
  createdAt: number;
}

interface FriendshipRecord {
  id: string;
  requesterId: string;
  addresseeId: string;
  status: FriendshipStatus;
  createdAt: number;
}

interface ServerRecord {
  id: string;
  name: string;
  icon: string;
  ownerId: string;
  inviteCode: string;
  createdAt: number;
}

interface ServerMemberRecord {
  serverId: string;
  userId: string;
  joinedAt: number;
}

interface ChannelRecord {
  id: string;
  serverId: string;
  name: string;
  type: "text";
  createdAt: number;
}

interface DmMessageRecord {
  id: string;
  senderId: string;
  recipientId: string;
  content: string;
  createdAt: number;
  embed?: MessageEmbed;
}

interface ChannelMessageRecord {
  id: string;
  channelId: string;
  authorId: string;
  content: string;
  createdAt: number;
  embed?: MessageEmbed;
}

interface Database {
  version: number;
  users: UserRecord[];
  friendships: FriendshipRecord[];
  servers: ServerRecord[];
  serverMembers: ServerMemberRecord[];
  channels: ChannelRecord[];
  dmMessages: DmMessageRecord[];
  channelMessages: ChannelMessageRecord[];
}

let db: Database;

function save() {
  writeFileSync(DB_PATH, JSON.stringify(db, null, 2), "utf-8");
}

function emptyDb(): Database {
  return {
    version: DB_VERSION,
    users: [],
    friendships: [],
    servers: [],
    serverMembers: [],
    channels: [],
    dmMessages: [],
    channelMessages: [],
  };
}

export function initDb() {
  mkdirSync(join(process.cwd(), "data"), { recursive: true });

  if (existsSync(DB_PATH)) {
    const parsed = JSON.parse(readFileSync(DB_PATH, "utf-8")) as Database;
    if (parsed.version === DB_VERSION) {
      db = parsed;
      return db;
    }
  }

  db = emptyDb();
  save();
  return db;
}

function formatMemberSince(ts: number): string {
  return new Date(ts).toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

export function toPublicUser(record: UserRecord): PublicUser {
  return {
    id: record.id,
    name: record.name,
    username: record.username,
    avatar: record.avatar,
    status: record.status,
    statusText: record.statusText || undefined,
    memberSince: formatMemberSince(record.createdAt),
  };
}

function getUserRecord(id: string): UserRecord | null {
  return db.users.find((u) => u.id === id) ?? null;
}

export function getUserById(id: string): PublicUser | null {
  const user = getUserRecord(id);
  return user ? toPublicUser(user) : null;
}

export function getUserByUsername(username: string): UserRecord | null {
  const normalized = username.toLowerCase();
  return db.users.find((u) => u.username.toLowerCase() === normalized) ?? null;
}

export function getUserByEmail(email: string): UserRecord | null {
  const normalized = email.toLowerCase();
  return db.users.find((u) => u.email.toLowerCase() === normalized) ?? null;
}

export function searchUsers(query: string, excludeId: string): PublicUser[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  return db.users
    .filter(
      (u) =>
        u.id !== excludeId &&
        (u.username.toLowerCase().includes(q) || u.name.toLowerCase().includes(q)),
    )
    .slice(0, 10)
    .map(toPublicUser);
}

export async function registerUser(input: {
  email: string;
  username: string;
  password: string;
  displayName: string;
}): Promise<PublicUser> {
  const email = input.email.trim().toLowerCase();
  const username = input.username.trim();
  const name = input.displayName.trim();

  if (!validateEmail(email)) throw new Error("Geçerli bir e-posta girin");
  if (!validateUsername(username)) throw new Error("Kullanıcı adı 3-20 karakter, harf/rakam/./_ olmalı");
  if (!validatePassword(input.password)) throw new Error("Şifre en az 6 karakter olmalı");
  if (!validateDisplayName(name)) throw new Error("Görünen ad 2-32 karakter olmalı");
  if (getUserByEmail(email)) throw new Error("Bu e-posta zaten kayıtlı");
  if (getUserByUsername(username)) throw new Error("Bu kullanıcı adı alınmış");

  const user: UserRecord = {
    id: randomUUID(),
    email,
    username,
    passwordHash: await hashPassword(input.password),
    name,
    avatar: avatarUrl(username),
    status: "offline",
    statusText: "",
    createdAt: Date.now(),
  };

  db.users.push(user);
  save();
  return toPublicUser(user);
}

export async function loginUser(login: string, password: string): Promise<PublicUser> {
  const value = login.trim();
  const user =
    getUserByUsername(value) ??
    getUserByEmail(value) ??
    db.users.find((u) => u.email.toLowerCase() === value.toLowerCase()) ??
    null;

  if (!user) throw new Error("Kullanıcı bulunamadı");
  if (!(await verifyPassword(password, user.passwordHash))) throw new Error("Şifre hatalı");
  return toPublicUser(user);
}

export function updateUserStatus(userId: string, status: Status) {
  const user = getUserRecord(userId);
  if (!user) return;
  user.status = status;
  save();
}

export function updateUserProfile(userId: string, data: { statusText?: string; status?: Status; name?: string }) {
  const user = getUserRecord(userId);
  if (!user) return null;
  if (data.statusText !== undefined) user.statusText = data.statusText.slice(0, 128);
  if (data.status !== undefined) user.status = data.status;
  if (data.name !== undefined && validateDisplayName(data.name)) user.name = data.name.trim();
  save();
  return toPublicUser(user);
}

function getFriendship(a: string, b: string): FriendshipRecord | null {
  return (
    db.friendships.find(
      (f) =>
        (f.requesterId === a && f.addresseeId === b) ||
        (f.requesterId === b && f.addresseeId === a),
    ) ?? null
  );
}

function areFriends(a: string, b: string): boolean {
  const f = getFriendship(a, b);
  return f?.status === "accepted";
}

export function getFriends(userId: string): PublicUser[] {
  return db.friendships
    .filter(
      (f) =>
        f.status === "accepted" &&
        (f.requesterId === userId || f.addresseeId === userId),
    )
    .map((f) => (f.requesterId === userId ? f.addresseeId : f.requesterId))
    .map((id) => getUserById(id))
    .filter((u): u is PublicUser => u !== null);
}

export function getPendingFriends(userId: string): FriendRequestInfo[] {
  return db.friendships
    .filter((f) => f.status === "pending" && (f.requesterId === userId || f.addresseeId === userId))
    .map((f) => {
      const otherId = f.requesterId === userId ? f.addresseeId : f.requesterId;
      const user = getUserById(otherId);
      if (!user) return null;
      return {
        ...user,
        direction: f.requesterId === userId ? "outgoing" : "incoming",
      } as FriendRequestInfo;
    })
    .filter((u): u is FriendRequestInfo => u !== null);
}

export function getBlockedUsers(userId: string): PublicUser[] {
  return db.friendships
    .filter(
      (f) =>
        f.status === "blocked" &&
        (f.requesterId === userId || f.addresseeId === userId),
    )
    .map((f) => (f.requesterId === userId ? f.addresseeId : f.requesterId))
    .map((id) => getUserById(id))
    .filter((u): u is PublicUser => u !== null);
}

export function sendFriendRequest(fromId: string, username: string): PublicUser {
  const target = getUserByUsername(username);
  if (!target) throw new Error("Kullanıcı bulunamadı");
  if (target.id === fromId) throw new Error("Kendinize istek gönderemezsiniz");

  const existing = getFriendship(fromId, target.id);
  if (existing?.status === "accepted") throw new Error("Zaten arkadaşsınız");
  if (existing?.status === "pending") throw new Error("İstek zaten gönderilmiş");
  if (existing?.status === "blocked") throw new Error("Bu kullanıcı engelli");

  db.friendships.push({
    id: randomUUID(),
    requesterId: fromId,
    addresseeId: target.id,
    status: "pending",
    createdAt: Date.now(),
  });
  save();
  return toPublicUser(target);
}

export function acceptFriendRequest(userId: string, requesterId: string): PublicUser {
  const f = db.friendships.find(
    (x) => x.requesterId === requesterId && x.addresseeId === userId && x.status === "pending",
  );
  if (!f) throw new Error("İstek bulunamadı");
  f.status = "accepted";
  save();
  return getUserById(requesterId)!;
}

export function declineFriendRequest(userId: string, requesterId: string) {
  const idx = db.friendships.findIndex(
    (x) => x.requesterId === requesterId && x.addresseeId === userId && x.status === "pending",
  );
  if (idx === -1) throw new Error("İstek bulunamadı");
  db.friendships.splice(idx, 1);
  save();
}

export function cancelFriendRequest(userId: string, addresseeId: string) {
  const idx = db.friendships.findIndex(
    (x) => x.requesterId === userId && x.addresseeId === addresseeId && x.status === "pending",
  );
  if (idx === -1) throw new Error("İstek bulunamadı");
  db.friendships.splice(idx, 1);
  save();
}

export function blockUser(userId: string, targetId: string) {
  const existing = getFriendship(userId, targetId);
  if (existing) db.friendships = db.friendships.filter((f) => f.id !== existing.id);
  db.friendships.push({
    id: randomUUID(),
    requesterId: userId,
    addresseeId: targetId,
    status: "blocked",
    createdAt: Date.now(),
  });
  save();
}

export function unblockUser(userId: string, targetId: string) {
  const idx = db.friendships.findIndex(
    (f) =>
      f.status === "blocked" &&
      ((f.requesterId === userId && f.addresseeId === targetId) ||
        (f.requesterId === targetId && f.addresseeId === userId)),
  );
  if (idx === -1) throw new Error("Engel bulunamadı");
  db.friendships.splice(idx, 1);
  save();
}

export function removeFriend(userId: string, friendId: string) {
  const existing = getFriendship(userId, friendId);
  if (!existing || existing.status !== "accepted") throw new Error("Arkadaş bulunamadı");
  db.friendships = db.friendships.filter((f) => f.id !== existing.id);
  save();
}

function toChatMessage(
  row: DmMessageRecord | ChannelMessageRecord,
  viewerId: string,
  authorId: string,
): ChatMessage {
  return {
    id: row.id,
    authorId: authorId === viewerId ? "me" : authorId,
    content: row.content,
    timestamp: formatTimestamp(row.createdAt),
    createdAt: row.createdAt,
    embed: row.embed,
  };
}

export function getDmMessages(userId: string, partnerId: string): ChatMessage[] {
  if (!areFriends(userId, partnerId)) throw new Error("Sadece arkadaşlarınıza mesaj gönderebilirsiniz");
  return db.dmMessages
    .filter(
      (m) =>
        (m.senderId === userId && m.recipientId === partnerId) ||
        (m.senderId === partnerId && m.recipientId === userId),
    )
    .sort((a, b) => a.createdAt - b.createdAt)
    .map((m) => toChatMessage(m, userId, m.senderId));
}

export function insertDmMessage(senderId: string, recipientId: string, content: string) {
  if (!areFriends(senderId, recipientId)) throw new Error("Sadece arkadaşlarınıza mesaj gönderebilirsiniz");

  const record: DmMessageRecord = {
    id: randomUUID(),
    senderId,
    recipientId,
    content,
    createdAt: Date.now(),
    embed: detectEmbed(content) ?? undefined,
  };
  db.dmMessages.push(record);
  save();

  return {
    forSender: toChatMessage(record, senderId, senderId),
    forRecipient: toChatMessage(record, recipientId, senderId),
  };
}

export function getDmPartners(userId: string): PublicUser[] {
  const ids = new Set<string>();
  for (const m of db.dmMessages) {
    if (m.senderId === userId) ids.add(m.recipientId);
    if (m.recipientId === userId) ids.add(m.senderId);
  }
  return [...ids].map((id) => getUserById(id)).filter((u): u is PublicUser => u !== null);
}

export function getUserServers(userId: string): ServerInfo[] {
  const serverIds = db.serverMembers.filter((m) => m.userId === userId).map((m) => m.serverId);
  return db.servers.filter((s) => serverIds.includes(s.id)).map(toServerInfo);
}

function toServerInfo(s: ServerRecord): ServerInfo {
  return { id: s.id, name: s.name, icon: s.icon, inviteCode: s.inviteCode, ownerId: s.ownerId };
}

export function createServer(ownerId: string, name: string): ServerInfo {
  const trimmed = name.trim();
  if (trimmed.length < 2 || trimmed.length > 32) throw new Error("Sunucu adı 2-32 karakter olmalı");

  let inviteCode = generateInviteCode();
  while (db.servers.some((s) => s.inviteCode === inviteCode)) {
    inviteCode = generateInviteCode();
  }

  const server: ServerRecord = {
    id: randomUUID(),
    name: trimmed,
    icon: serverIconUrl(trimmed),
    ownerId,
    inviteCode,
    createdAt: Date.now(),
  };

  const generalChannel: ChannelRecord = {
    id: randomUUID(),
    serverId: server.id,
    name: "general",
    type: "text",
    createdAt: Date.now(),
  };

  db.servers.push(server);
  db.serverMembers.push({ serverId: server.id, userId: ownerId, joinedAt: Date.now() });
  db.channels.push(generalChannel);
  save();
  return toServerInfo(server);
}

export function joinServer(userId: string, inviteCode: string): ServerInfo {
  const code = inviteCode.trim().toUpperCase();
  const server = db.servers.find((s) => s.inviteCode === code);
  if (!server) throw new Error("Geçersiz davet kodu");
  if (db.serverMembers.some((m) => m.serverId === server.id && m.userId === userId)) {
    return toServerInfo(server);
  }
  db.serverMembers.push({ serverId: server.id, userId, joinedAt: Date.now() });
  save();
  return toServerInfo(server);
}

export function isServerMember(userId: string, serverId: string): boolean {
  return db.serverMembers.some((m) => m.serverId === serverId && m.userId === userId);
}

export function getServerChannels(serverId: string, userId: string): ChannelInfo[] {
  if (!isServerMember(userId, serverId)) throw new Error("Bu sunucunun üyesi değilsiniz");
  return db.channels
    .filter((c) => c.serverId === serverId)
    .sort((a, b) => a.createdAt - b.createdAt)
    .map((c) => ({ id: c.id, serverId: c.serverId, name: c.name, type: c.type }));
}

export function createChannel(serverId: string, userId: string, name: string): ChannelInfo {
  const server = db.servers.find((s) => s.id === serverId);
  if (!server) throw new Error("Sunucu bulunamadı");
  if (server.ownerId !== userId) throw new Error("Sadece sunucu sahibi kanal oluşturabilir");

  const channelName = name.trim().toLowerCase().replace(/\s+/g, "-");
  if (channelName.length < 2 || channelName.length > 32) throw new Error("Kanal adı 2-32 karakter olmalı");
  if (db.channels.some((c) => c.serverId === serverId && c.name === channelName)) {
    throw new Error("Bu isimde kanal zaten var");
  }

  const channel: ChannelRecord = {
    id: randomUUID(),
    serverId,
    name: channelName,
    type: "text",
    createdAt: Date.now(),
  };
  db.channels.push(channel);
  save();
  return { id: channel.id, serverId, name: channel.name, type: "text" };
}

export function getChannelById(channelId: string): ChannelRecord | null {
  return db.channels.find((c) => c.id === channelId) ?? null;
}

export function getChannelMessages(channelId: string, userId: string): ChatMessage[] {
  const channel = getChannelById(channelId);
  if (!channel) throw new Error("Kanal bulunamadı");
  if (!isServerMember(userId, channel.serverId)) throw new Error("Bu kanala erişiminiz yok");

  return db.channelMessages
    .filter((m) => m.channelId === channelId)
    .sort((a, b) => a.createdAt - b.createdAt)
    .map((m) => toChatMessage(m, userId, m.authorId));
}

export function insertChannelMessage(channelId: string, authorId: string, content: string) {
  const channel = getChannelById(channelId);
  if (!channel) throw new Error("Kanal bulunamadı");
  if (!isServerMember(authorId, channel.serverId)) throw new Error("Bu kanala mesaj gönderemezsiniz");

  const record: ChannelMessageRecord = {
    id: randomUUID(),
    channelId,
    authorId,
    content,
    createdAt: Date.now(),
    embed: detectEmbed(content) ?? undefined,
  };
  db.channelMessages.push(record);
  save();

  return {
    channelId,
    message: toChatMessage(record, authorId, authorId),
    broadcast: db.serverMembers
      .filter((m) => m.serverId === channel.serverId)
      .map((m) => ({
        userId: m.userId,
        message: toChatMessage(record, m.userId, authorId),
      })),
  };
}

export function getServerMembers(serverId: string, userId: string): PublicUser[] {
  if (!isServerMember(userId, serverId)) throw new Error("Bu sunucunun üyesi değilsiniz");
  return db.serverMembers
    .filter((m) => m.serverId === serverId)
    .map((m) => getUserById(m.userId))
    .filter((u): u is PublicUser => u !== null);
}

export function getServerById(serverId: string): ServerInfo | null {
  const s = db.servers.find((x) => x.id === serverId);
  return s ? toServerInfo(s) : null;
}

export function getAuthorPublic(authorId: string): PublicUser | null {
  return getUserById(authorId);
}
