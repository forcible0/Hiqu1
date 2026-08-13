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
  AccountUser,
  ChannelInfo,
  ChatMessage,
  FriendRequestInfo,
  FriendshipStatus,
  GroupDmInfo,
  MessageEmbed,
  MessageRequestInfo,
  PublicUser,
  ServerInfo,
  Status,
  UserSettings,
} from "./types.js";
import { defaultUserSettings, VALID_THEMES } from "./types.js";
import { migrateDatabase, migrateToV4, migrateToV5, migrateToV6 } from "./migrate.js";
import { detectEmbed, formatTimestamp } from "./utils.js";

const DB_VERSION = 6;
const DB_PATH = join(process.cwd(), "data", "db.json");

interface UserRecord {
  id: string;
  email: string;
  username: string;
  passwordHash: string;
  name: string;
  avatar: string;
  banner: string;
  bio: string;
  accentColor: string;
  status: Status;
  statusText: string;
  settings: UserSettings;
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
  banner: string;
  description: string;
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

interface MessageReactionRecord {
  emoji: string;
  userIds: string[];
}

interface DmMessageRecord {
  id: string;
  senderId: string;
  recipientId: string;
  content: string;
  createdAt: number;
  embed?: MessageEmbed;
  replyToId?: string;
  reactions?: MessageReactionRecord[];
}

interface ChannelMessageRecord {
  id: string;
  channelId: string;
  authorId: string;
  content: string;
  createdAt: number;
  embed?: MessageEmbed;
  replyToId?: string;
  reactions?: MessageReactionRecord[];
}

interface DmContactRecord {
  userId1: string;
  userId2: string;
}

interface MessageRequestRecord {
  id: string;
  senderId: string;
  recipientId: string;
  content: string;
  createdAt: number;
  status: "pending" | "accepted" | "declined";
}

interface GroupDmRecord {
  id: string;
  name: string;
  icon: string;
  createdBy: string;
  createdAt: number;
}

interface GroupDmMemberRecord {
  groupId: string;
  userId: string;
}

interface GroupDmMessageRecord {
  id: string;
  groupId: string;
  senderId: string;
  content: string;
  createdAt: number;
  embed?: MessageEmbed;
  replyToId?: string;
  reactions?: MessageReactionRecord[];
}

type ChatScope = "dm" | "group" | "channel";

interface PinnedMessageRecord {
  id: string;
  scope: ChatScope;
  scopeKey: string;
  messageId: string;
  pinnedBy: string;
  pinnedAt: number;
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
  dmContacts: DmContactRecord[];
  messageRequests: MessageRequestRecord[];
  groupDms: GroupDmRecord[];
  groupDmMembers: GroupDmMemberRecord[];
  groupDmMessages: GroupDmMessageRecord[];
  pinnedMessages: PinnedMessageRecord[];
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
    dmContacts: [],
    messageRequests: [],
    groupDms: [],
    groupDmMembers: [],
    groupDmMessages: [],
    pinnedMessages: [],
  };
}

export function initDb() {
  mkdirSync(join(process.cwd(), "data"), { recursive: true });

  if (existsSync(DB_PATH)) {
    const parsed = JSON.parse(readFileSync(DB_PATH, "utf-8")) as Database & { version?: number };
    if (parsed.version === DB_VERSION) {
      db = parsed;
      if (!db.pinnedMessages) db.pinnedMessages = [];
      return db;
    }
    if (parsed.version === 5) {
      db = migrateToV6(parsed as unknown as Record<string, unknown>) as Database;
      save();
      return db;
    }
    if (parsed.version === 4) {
      db = migrateToV5(parsed as unknown as Record<string, unknown>) as Database;
      save();
      return db;
    }
    if (parsed.version === 3) {
      db = migrateToV4(parsed as unknown as Record<string, unknown>) as Database;
      save();
      return db;
    }
    if (parsed.version === 2 || parsed.users) {
      db = migrateDatabase(parsed as unknown as Record<string, unknown>) as Database;
      save();
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
    banner: record.banner || undefined,
    bio: record.bio || undefined,
    accentColor: record.accentColor,
    status: record.settings.privacyShowStatus ? record.status : "offline",
    statusText: record.statusText || undefined,
    memberSince: formatMemberSince(record.createdAt),
  };
}

export function toAccountUser(record: UserRecord): AccountUser {
  const settings: UserSettings = VALID_THEMES.includes(record.settings.theme)
    ? record.settings
    : { ...record.settings, theme: "midnight" };
  return {
    ...toPublicUser(record),
    email: record.email,
    status: record.status,
    settings,
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
}): Promise<AccountUser> {
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
    banner: "",
    bio: "",
    accentColor: "#3fb9b6",
    status: "offline",
    statusText: "",
    settings: defaultUserSettings(),
    createdAt: Date.now(),
  };

  db.users.push(user);
  save();
  return toAccountUser(user);
}

export async function loginUser(login: string, password: string): Promise<AccountUser> {
  const value = login.trim();
  const user =
    getUserByUsername(value) ??
    getUserByEmail(value) ??
    db.users.find((u) => u.email.toLowerCase() === value.toLowerCase()) ??
    null;

  if (!user) throw new Error("Kullanıcı bulunamadı");
  if (!(await verifyPassword(password, user.passwordHash))) throw new Error("Şifre hatalı");
  return toAccountUser(user);
}

export function updateUserStatus(userId: string, status: Status) {
  const user = getUserRecord(userId);
  if (!user) return;
  user.status = status;
  save();
}

export function getAccountUser(userId: string): AccountUser | null {
  const user = getUserRecord(userId);
  return user ? toAccountUser(user) : null;
}

export function updateUserProfile(
  userId: string,
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
  const user = getUserRecord(userId);
  if (!user) return null;
  if (data.statusText !== undefined) user.statusText = data.statusText.slice(0, 128);
  if (data.status !== undefined) user.status = data.status;
  if (data.name !== undefined && validateDisplayName(data.name)) user.name = data.name.trim();
  if (data.avatar !== undefined) user.avatar = data.avatar.slice(0, 512);
  if (data.banner !== undefined) user.banner = data.banner.slice(0, 512);
  if (data.bio !== undefined) user.bio = data.bio.slice(0, 300);
  if (data.accentColor !== undefined) user.accentColor = data.accentColor.slice(0, 32);
  save();
  return toAccountUser(user);
}

export function updateUserSettings(userId: string, settings: Partial<UserSettings>): AccountUser | null {
  const user = getUserRecord(userId);
  if (!user) return null;
  const next = { ...settings };
  if (next.theme && !VALID_THEMES.includes(next.theme)) delete next.theme;
  user.settings = { ...user.settings, ...next };
  save();
  return toAccountUser(user);
}

export async function changeUserPassword(userId: string, currentPassword: string, newPassword: string) {
  const user = getUserRecord(userId);
  if (!user) throw new Error("Kullanıcı bulunamadı");
  if (!(await verifyPassword(currentPassword, user.passwordHash))) {
    throw new Error("Mevcut şifre hatalı");
  }
  if (!validatePassword(newPassword)) throw new Error("Yeni şifre en az 6 karakter olmalı");
  user.passwordHash = await hashPassword(newPassword);
  save();
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

function isBlockedBetween(a: string, b: string): boolean {
  const f = getFriendship(a, b);
  return f?.status === "blocked";
}

function normalizePair(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

function hasDmContact(a: string, b: string): boolean {
  const [u1, u2] = normalizePair(a, b);
  return db.dmContacts.some((c) => c.userId1 === u1 && c.userId2 === u2);
}

function addDmContact(a: string, b: string) {
  if (hasDmContact(a, b)) return;
  const [u1, u2] = normalizePair(a, b);
  db.dmContacts.push({ userId1: u1, userId2: u2 });
  save();
}

function canDirectMessage(a: string, b: string): boolean {
  if (isBlockedBetween(a, b)) return false;
  return areFriends(a, b) || hasDmContact(a, b);
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
  const targetRecord = getUserByUsername(username);
  if (!targetRecord) throw new Error("Kullanıcı bulunamadı");
  if (targetRecord.id === fromId) throw new Error("Kendinize istek gönderemezsiniz");
  if (!targetRecord.settings.privacyAllowFriendRequests) {
    throw new Error("Bu kullanıcı arkadaşlık isteklerini kapattı");
  }

  const target = toPublicUser(targetRecord);

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
  return target;
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

function mapReactions(reactions: MessageReactionRecord[] | undefined, viewerId: string) {
  if (!reactions?.length) return undefined;
  const mapped = reactions
    .filter((r) => r.userIds.length > 0)
    .map((r) => ({
      emoji: r.emoji,
      userIds: r.userIds.map((id) => (id === viewerId ? "me" : id)),
    }));
  return mapped.length > 0 ? mapped : undefined;
}

function toChatMessage(
  row: DmMessageRecord | ChannelMessageRecord | GroupDmMessageRecord,
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
    replyToId: row.replyToId,
    reactions: mapReactions(row.reactions, viewerId),
  };
}

export function parseChatId(chatId: string): { scope: ChatScope; scopeId: string } | null {
  if (chatId.startsWith("dm-")) return { scope: "dm", scopeId: chatId.slice(3) };
  if (chatId.startsWith("group-")) return { scope: "group", scopeId: chatId.slice(6) };
  if (chatId.startsWith("channel-")) return { scope: "channel", scopeId: chatId.slice(8) };
  return null;
}

function chatScopeKey(scope: ChatScope, scopeId: string, viewerId: string): string {
  if (scope === "dm") return viewerId < scopeId ? `${viewerId}:${scopeId}` : `${scopeId}:${viewerId}`;
  return scopeId;
}

function assertChatAccess(userId: string, scope: ChatScope, scopeId: string) {
  if (scope === "dm") {
    if (!canDirectMessage(userId, scopeId)) throw new Error("Bu sohbete erişiminiz yok");
    return;
  }
  if (scope === "group") {
    if (!isGroupMember(scopeId, userId)) throw new Error("Bu gruba erişiminiz yok");
    return;
  }
  const channel = getChannelById(scopeId);
  if (!channel || !isServerMember(userId, channel.serverId)) throw new Error("Bu kanala erişiminiz yok");
}

function findMessageRecord(
  scope: ChatScope,
  scopeKey: string,
  messageId: string,
): DmMessageRecord | ChannelMessageRecord | GroupDmMessageRecord | null {
  if (scope === "dm") {
    const [a, b] = scopeKey.split(":");
    return (
      db.dmMessages.find(
        (m) =>
          m.id === messageId &&
          ((m.senderId === a && m.recipientId === b) || (m.senderId === b && m.recipientId === a)),
      ) ?? null
    );
  }
  if (scope === "group") {
    return db.groupDmMessages.find((m) => m.id === messageId && m.groupId === scopeKey) ?? null;
  }
  return db.channelMessages.find((m) => m.id === messageId && m.channelId === scopeKey) ?? null;
}

function messageAuthorId(row: DmMessageRecord | ChannelMessageRecord | GroupDmMessageRecord): string {
  if ("authorId" in row) return row.authorId;
  return row.senderId;
}

function resolveAuthorName(viewerId: string, authorId: string): string {
  if (authorId === "me" || authorId === viewerId) return "Sen";
  return getUserById(authorId)?.name ?? "Bilinmeyen";
}

function enrichReplies(messages: ChatMessage[], viewerId: string): ChatMessage[] {
  const byId = new Map(messages.map((m) => [m.id, m]));
  return messages.map((m) => {
    if (!m.replyToId) return m;
    const ref = byId.get(m.replyToId);
    if (!ref) return m;
    return {
      ...m,
      replyTo: {
        id: ref.id,
        authorId: ref.authorId,
        authorName: resolveAuthorName(viewerId, ref.authorId),
        content: ref.content.slice(0, 120) || (ref.embed ? "Embed" : ""),
      },
    };
  });
}

export function getDmMessages(userId: string, partnerId: string): ChatMessage[] {
  if (!canDirectMessage(userId, partnerId)) {
    throw new Error("Bu kullanıcıyla mesajlaşma izniniz yok");
  }
  return enrichReplies(
    db.dmMessages
      .filter(
        (m) =>
          (m.senderId === userId && m.recipientId === partnerId) ||
          (m.senderId === partnerId && m.recipientId === userId),
      )
      .sort((a, b) => a.createdAt - b.createdAt)
      .map((m) => toChatMessage(m, userId, m.senderId)),
    userId,
  );
}

export function insertDmMessage(
  senderId: string,
  recipientId: string,
  content: string,
  replyToId?: string,
) {
  if (!canDirectMessage(senderId, recipientId)) {
    throw new Error("Bu kullanıcıya mesaj gönderemezsiniz");
  }

  const record: DmMessageRecord = {
    id: randomUUID(),
    senderId,
    recipientId,
    content,
    createdAt: Date.now(),
    embed: detectEmbed(content) ?? undefined,
    replyToId: replyToId || undefined,
  };
  db.dmMessages.push(record);
  save();

  return {
    forSender: toChatMessage(record, senderId, senderId),
    forRecipient: toChatMessage(record, recipientId, senderId),
  };
}

function toMessageRequestInfo(record: MessageRequestRecord): MessageRequestInfo {
  const from = getUserById(record.senderId);
  if (!from) throw new Error("Kullanıcı bulunamadı");
  return {
    id: record.id,
    from,
    content: record.content,
    createdAt: record.createdAt,
  };
}

export function getMessageRequests(userId: string): MessageRequestInfo[] {
  return db.messageRequests
    .filter((r) => r.recipientId === userId && r.status === "pending")
    .sort((a, b) => b.createdAt - a.createdAt)
    .map(toMessageRequestInfo);
}

function createOrUpdateMessageRequest(senderId: string, recipientId: string, content: string) {
  const existing = db.messageRequests.find(
    (r) => r.senderId === senderId && r.recipientId === recipientId && r.status === "pending",
  );
  if (existing) {
    existing.content = content;
    existing.createdAt = Date.now();
    save();
    return existing;
  }
  const record: MessageRequestRecord = {
    id: randomUUID(),
    senderId,
    recipientId,
    content,
    createdAt: Date.now(),
    status: "pending",
  };
  db.messageRequests.push(record);
  save();
  return record;
}

export function sendDirectOrRequest(
  senderId: string,
  recipientId: string,
  content: string,
  replyToId?: string,
) {
  if (senderId === recipientId) throw new Error("Kendinize mesaj gönderemezsiniz");
  if (isBlockedBetween(senderId, recipientId)) throw new Error("Bu kullanıcı engelli");

  if (canDirectMessage(senderId, recipientId)) {
    const result = insertDmMessage(senderId, recipientId, content, replyToId);
    return { type: "dm" as const, ...result };
  }

  const request = createOrUpdateMessageRequest(senderId, recipientId, content);
  return { type: "request" as const, request: toMessageRequestInfo(request) };
}

export function acceptMessageRequest(userId: string, requestId: string) {
  const request = db.messageRequests.find((r) => r.id === requestId);
  if (!request || request.recipientId !== userId || request.status !== "pending") {
    throw new Error("İstek bulunamadı");
  }

  request.status = "accepted";
  addDmContact(request.senderId, request.recipientId);

  const { forSender, forRecipient } = insertDmMessage(
    request.senderId,
    request.recipientId,
    request.content,
  );
  save();

  return {
    partnerId: request.senderId,
    forAcceptor: forRecipient,
    forSender,
  };
}

export function declineMessageRequest(userId: string, requestId: string) {
  const request = db.messageRequests.find((r) => r.id === requestId);
  if (!request || request.recipientId !== userId || request.status !== "pending") {
    throw new Error("İstek bulunamadı");
  }
  request.status = "declined";
  save();
}

function toGroupDmInfo(group: GroupDmRecord): GroupDmInfo {
  const memberIds = db.groupDmMembers.filter((m) => m.groupId === group.id).map((m) => m.userId);
  const members = memberIds.map((id) => getUserById(id)).filter((u): u is PublicUser => u !== null);
  return {
    id: group.id,
    name: group.name,
    icon: group.icon,
    members,
  };
}

function isGroupMember(groupId: string, userId: string): boolean {
  return db.groupDmMembers.some((m) => m.groupId === groupId && m.userId === userId);
}

function groupDisplayName(memberIds: string[]): string {
  const names = memberIds
    .slice(0, 3)
    .map((id) => getUserById(id)?.name)
    .filter((n): n is string => Boolean(n));
  if (names.length <= 2) return names.join(", ");
  return `${names.slice(0, 2).join(", ")}, ${names.length - 2} kişi daha`;
}

export function createGroupDm(creatorId: string, memberIds: string[], name?: string): GroupDmInfo {
  const unique = [...new Set([creatorId, ...memberIds])];
  if (unique.length < 2) throw new Error("Grup için en az 2 kişi gerekli");

  for (const id of memberIds) {
    if (id === creatorId) continue;
    if (!areFriends(creatorId, id)) {
      throw new Error("Grup oluşturmak için tüm üyeler arkadaş olmalı");
    }
  }

  const trimmedName = name?.trim();
  const groupName = trimmedName && trimmedName.length >= 1 ? trimmedName.slice(0, 64) : groupDisplayName(unique);
  const group: GroupDmRecord = {
    id: randomUUID(),
    name: groupName,
    icon: avatarUrl(groupName),
    createdBy: creatorId,
    createdAt: Date.now(),
  };

  db.groupDms.push(group);
  for (const userId of unique) {
    db.groupDmMembers.push({ groupId: group.id, userId });
  }
  save();
  return toGroupDmInfo(group);
}

export function getUserGroupDms(userId: string): GroupDmInfo[] {
  const groupIds = db.groupDmMembers.filter((m) => m.userId === userId).map((m) => m.groupId);
  return db.groupDms
    .filter((g) => groupIds.includes(g.id))
    .sort((a, b) => b.createdAt - a.createdAt)
    .map(toGroupDmInfo);
}

export function getGroupDmMessages(groupId: string, userId: string): ChatMessage[] {
  if (!isGroupMember(groupId, userId)) throw new Error("Bu gruba erişiminiz yok");
  return enrichReplies(
    db.groupDmMessages
      .filter((m) => m.groupId === groupId)
      .sort((a, b) => a.createdAt - b.createdAt)
      .map((m) => toChatMessage(m, userId, m.senderId)),
    userId,
  );
}

export function insertGroupDmMessage(
  groupId: string,
  senderId: string,
  content: string,
  replyToId?: string,
) {
  if (!isGroupMember(groupId, senderId)) throw new Error("Bu gruba mesaj gönderemezsiniz");

  const record: GroupDmMessageRecord = {
    id: randomUUID(),
    groupId,
    senderId,
    content,
    createdAt: Date.now(),
    embed: detectEmbed(content) ?? undefined,
    replyToId: replyToId || undefined,
  };
  db.groupDmMessages.push(record);
  save();

  const memberIds = db.groupDmMembers.filter((m) => m.groupId === groupId).map((m) => m.userId);
  const broadcast = memberIds.map((uid) => ({
    userId: uid,
    message: toChatMessage(record, uid, senderId),
  }));

  return { record, broadcast };
}

export function getGroupDmById(groupId: string, userId: string): GroupDmInfo | null {
  if (!isGroupMember(groupId, userId)) return null;
  const group = db.groupDms.find((g) => g.id === groupId);
  return group ? toGroupDmInfo(group) : null;
}

function getFriendIds(userId: string): Set<string> {
  const ids = new Set<string>();
  for (const f of db.friendships) {
    if (f.status !== "accepted") continue;
    if (f.requesterId === userId) ids.add(f.addresseeId);
    if (f.addresseeId === userId) ids.add(f.requesterId);
  }
  return ids;
}

export function getUserProfile(viewerId: string, targetId: string) {
  const user = getUserById(targetId);
  if (!user) throw new Error("Kullanıcı bulunamadı");

  const viewerServerIds = new Set(
    db.serverMembers.filter((m) => m.userId === viewerId).map((m) => m.serverId),
  );
  const mutualServerIds = db.serverMembers
    .filter((m) => m.userId === targetId && viewerServerIds.has(m.serverId))
    .map((m) => m.serverId);
  const mutualServers = db.servers
    .filter((s) => mutualServerIds.includes(s.id))
    .map(toServerInfo);

  const viewerFriends = getFriendIds(viewerId);
  const targetFriends = getFriendIds(targetId);
  const mutualFriends = [...viewerFriends]
    .filter((id) => targetFriends.has(id) && id !== viewerId && id !== targetId)
    .map((id) => getUserById(id))
    .filter((u): u is PublicUser => u !== null);

  const friendship = getFriendship(viewerId, targetId);
  const isFriend = friendship?.status === "accepted";
  const friendsSince =
    isFriend && friendship ? formatMemberSince(friendship.createdAt) : undefined;

  return { user, mutualServers, mutualFriends, friendsSince, isFriend };
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
  return {
    id: s.id,
    name: s.name,
    icon: s.icon,
    banner: s.banner || undefined,
    description: s.description || undefined,
    inviteCode: s.inviteCode,
    ownerId: s.ownerId,
  };
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
    banner: "",
    description: "",
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

export function leaveServer(userId: string, serverId: string): void {
  const server = db.servers.find((s) => s.id === serverId);
  if (!server) throw new Error("Sunucu bulunamadı");
  if (server.ownerId === userId) {
    throw new Error("Sunucu sahibi ayrılamaz. Sunucuyu silmeniz gerekir.");
  }
  const idx = db.serverMembers.findIndex((m) => m.serverId === serverId && m.userId === userId);
  if (idx === -1) throw new Error("Bu sunucunun üyesi değilsiniz");
  db.serverMembers.splice(idx, 1);
  save();
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

  return enrichReplies(
    db.channelMessages
      .filter((m) => m.channelId === channelId)
      .sort((a, b) => a.createdAt - b.createdAt)
      .map((m) => toChatMessage(m, userId, m.authorId)),
    userId,
  );
}

export function insertChannelMessage(
  channelId: string,
  authorId: string,
  content: string,
  replyToId?: string,
) {
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
    replyToId: replyToId || undefined,
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

export function getPinnedMessageIds(userId: string, chatId: string): string[] {
  const parsed = parseChatId(chatId);
  if (!parsed) throw new Error("Geçersiz sohbet");
  assertChatAccess(userId, parsed.scope, parsed.scopeId);
  const key = chatScopeKey(parsed.scope, parsed.scopeId, userId);
  return db.pinnedMessages
    .filter((p) => p.scope === parsed.scope && p.scopeKey === key)
    .sort((a, b) => b.pinnedAt - a.pinnedAt)
    .map((p) => p.messageId);
}

export function pinChatMessage(userId: string, chatId: string, messageId: string): string[] {
  const parsed = parseChatId(chatId);
  if (!parsed) throw new Error("Geçersiz sohbet");
  assertChatAccess(userId, parsed.scope, parsed.scopeId);
  const key = chatScopeKey(parsed.scope, parsed.scopeId, userId);
  const record = findMessageRecord(parsed.scope, key, messageId);
  if (!record) throw new Error("Mesaj bulunamadı");

  db.pinnedMessages = db.pinnedMessages.filter(
    (p) => !(p.scope === parsed.scope && p.scopeKey === key && p.messageId === messageId),
  );
  db.pinnedMessages.unshift({
    id: randomUUID(),
    scope: parsed.scope,
    scopeKey: key,
    messageId,
    pinnedBy: userId,
    pinnedAt: Date.now(),
  });

  const pins = db.pinnedMessages
    .filter((p) => p.scope === parsed.scope && p.scopeKey === key)
    .sort((a, b) => b.pinnedAt - a.pinnedAt);
  db.pinnedMessages = [
    ...db.pinnedMessages.filter((p) => !(p.scope === parsed.scope && p.scopeKey === key)),
    ...pins.slice(0, 50),
  ];
  save();
  return getPinnedMessageIds(userId, chatId);
}

export function unpinChatMessage(userId: string, chatId: string, messageId: string): string[] {
  const parsed = parseChatId(chatId);
  if (!parsed) throw new Error("Geçersiz sohbet");
  assertChatAccess(userId, parsed.scope, parsed.scopeId);
  const key = chatScopeKey(parsed.scope, parsed.scopeId, userId);
  db.pinnedMessages = db.pinnedMessages.filter(
    (p) => !(p.scope === parsed.scope && p.scopeKey === key && p.messageId === messageId),
  );
  save();
  return getPinnedMessageIds(userId, chatId);
}

export function toggleMessageReaction(
  userId: string,
  chatId: string,
  messageId: string,
  emoji: string,
): { reactions: MessageReactionRecord[]; authorId: string } {
  const trimmed = emoji.trim();
  if (!trimmed) throw new Error("Geçersiz emoji");
  const parsed = parseChatId(chatId);
  if (!parsed) throw new Error("Geçersiz sohbet");
  assertChatAccess(userId, parsed.scope, parsed.scopeId);
  const key = chatScopeKey(parsed.scope, parsed.scopeId, userId);
  const record = findMessageRecord(parsed.scope, key, messageId);
  if (!record) throw new Error("Mesaj bulunamadı");

  if (!record.reactions) record.reactions = [];
  const existing = record.reactions.find((r) => r.emoji === trimmed);
  if (existing) {
    const idx = existing.userIds.indexOf(userId);
    if (idx >= 0) existing.userIds.splice(idx, 1);
    else existing.userIds.push(userId);
    if (existing.userIds.length === 0) {
      record.reactions = record.reactions.filter((r) => r.emoji !== trimmed);
    }
  } else {
    record.reactions.push({ emoji: trimmed, userIds: [userId] });
  }
  save();
  return {
    reactions: record.reactions ?? [],
    authorId: messageAuthorId(record),
  };
}

export function getReactionBroadcastTargets(chatId: string, viewerId: string): string[] {
  const parsed = parseChatId(chatId);
  if (!parsed) return [];
  if (parsed.scope === "dm") return [viewerId, parsed.scopeId];
  if (parsed.scope === "group") {
    return db.groupDmMembers.filter((m) => m.groupId === parsed.scopeId).map((m) => m.userId);
  }
  const channel = getChannelById(parsed.scopeId);
  if (!channel) return [];
  return db.serverMembers.filter((m) => m.serverId === channel.serverId).map((m) => m.userId);
}

export function getAuthorPublic(authorId: string): PublicUser | null {
  return getUserById(authorId);
}

export function updateServerSettings(
  serverId: string,
  userId: string,
  data: { name?: string; icon?: string; banner?: string; description?: string },
): ServerInfo {
  const server = db.servers.find((s) => s.id === serverId);
  if (!server) throw new Error("Sunucu bulunamadı");
  if (server.ownerId !== userId) throw new Error("Sadece sunucu sahibi ayarları değiştirebilir");

  if (data.name !== undefined) {
    const trimmed = data.name.trim();
    if (trimmed.length < 2 || trimmed.length > 32) throw new Error("Sunucu adı 2-32 karakter olmalı");
    server.name = trimmed;
  }
  if (data.icon !== undefined) server.icon = data.icon.slice(0, 512);
  if (data.banner !== undefined) server.banner = data.banner.slice(0, 512);
  if (data.description !== undefined) server.description = data.description.slice(0, 500);

  save();
  return toServerInfo(server);
}

export function regenerateServerInvite(serverId: string, userId: string): ServerInfo {
  const server = db.servers.find((s) => s.id === serverId);
  if (!server) throw new Error("Sunucu bulunamadı");
  if (server.ownerId !== userId) throw new Error("Sadece sunucu sahibi davet kodunu yenileyebilir");

  let inviteCode = generateInviteCode();
  while (db.servers.some((s) => s.inviteCode === inviteCode && s.id !== serverId)) {
    inviteCode = generateInviteCode();
  }
  server.inviteCode = inviteCode;
  save();
  return toServerInfo(server);
}

export async function deleteUserAccount(userId: string, password: string) {
  const user = getUserRecord(userId);
  if (!user) throw new Error("Kullanıcı bulunamadı");
  if (!(await verifyPassword(password, user.passwordHash))) {
    throw new Error("Şifre hatalı");
  }

  const ownedServerIds = db.servers.filter((s) => s.ownerId === userId).map((s) => s.id);

  db.users = db.users.filter((u) => u.id !== userId);
  db.friendships = db.friendships.filter(
    (f) => f.requesterId !== userId && f.addresseeId !== userId,
  );
  db.dmMessages = db.dmMessages.filter(
    (m) => m.senderId !== userId && m.recipientId !== userId,
  );
  db.dmContacts = db.dmContacts.filter((c) => c.userId1 !== userId && c.userId2 !== userId);
  db.messageRequests = db.messageRequests.filter(
    (r) => r.senderId !== userId && r.recipientId !== userId,
  );
  db.groupDmMembers = db.groupDmMembers.filter((m) => m.userId !== userId);
  db.groupDmMessages = db.groupDmMessages.filter((m) => m.senderId !== userId);
  const activeGroupIds = new Set(db.groupDmMembers.map((m) => m.groupId));
  db.groupDms = db.groupDms.filter((g) => activeGroupIds.has(g.id));
  db.serverMembers = db.serverMembers.filter((m) => m.userId !== userId);
  db.channelMessages = db.channelMessages.filter((m) => {
    if (m.authorId === userId) return false;
    const channel = db.channels.find((c) => c.id === m.channelId);
    return channel ? !ownedServerIds.includes(channel.serverId) : false;
  });
  db.channels = db.channels.filter((c) => !ownedServerIds.includes(c.serverId));
  db.servers = db.servers.filter((s) => s.ownerId !== userId);

  save();
}
