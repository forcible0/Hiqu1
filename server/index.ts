import "dotenv/config";
import { randomUUID } from "node:crypto";
import { createServer } from "node:http";
import cors from "cors";
import express from "express";
import { Server } from "socket.io";
import {
  acceptFriendRequest,
  acceptMessageRequest,
  blockUser,
  cancelFriendRequest,
  createChannel,
  createGroupDm,
  createServer as createServerRecord,
  declineFriendRequest,
  declineMessageRequest,
  getBlockedUsers,
  getChannelById,
  getChannelMessages,
  getDmMessages,
  getDmPartners,
  getFriends,
  getGroupDmById,
  getGroupDmMessages,
  getMessageRequests,
  getPendingFriends,
  getServerById,
  getServerChannels,
  getServerMembers,
  getUserGroupDms,
  getUserProfile,
  changeUserPassword,
  deleteUserAccount,
  getAccountUser,
  getUserById,
  getUserServers,
  getPinnedMessageIds,
  getReactionBroadcastTargets,
  initDb,
  insertChannelMessage,
  insertGroupDmMessage,
  joinServer,
  leaveServer,
  loginUser,
  pinChatMessage,
  registerUser,
  regenerateServerInvite,
  removeFriend,
  searchUsers,
  sendDirectOrRequest,
  sendFriendRequest,
  toggleMessageReaction,
  unpinChatMessage,
  unblockUser,
  updateServerSettings,
  updateUserProfile,
  updateUserSettings,
  updateUserStatus,
} from "./db.js";
import { saveUserImage, saveServerImage, UPLOADS_ROOT } from "./uploads.js";
import { searchGifs, trendingGifs } from "./giphy.js";
import type { Status, UserSettings } from "./types.js";

initDb();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:5174", "http://localhost:5175"], credentials: true },
});

app.use(cors({ origin: ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:5174", "http://localhost:5175"], credentials: true }));
app.use(express.json({ limit: "4mb" }));
app.use("/uploads", express.static(UPLOADS_ROOT));

const sessions = new Map<string, string>();
const onlineUsers = new Map<string, Set<string>>();

type AuthedRequest = express.Request & { userId: string };

function createSession(userId: string) {
  const token = randomUUID();
  sessions.set(token, userId);
  return token;
}

function getUserIdFromToken(token: string | undefined) {
  if (!token) return null;
  return sessions.get(token) ?? null;
}

function revokeUserSessions(userId: string) {
  for (const [token, uid] of sessions) {
    if (uid === userId) sessions.delete(token);
  }
}

function authMiddleware(req: express.Request, res: express.Response, next: express.NextFunction) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  const userId = getUserIdFromToken(token);
  if (!userId) {
    res.status(401).json({ error: "Oturum gerekli" });
    return;
  }
  (req as AuthedRequest).userId = userId;
  next();
}

function handleError(res: express.Response, err: unknown) {
  const message = err instanceof Error ? err.message : "Bir hata oluştu";
  res.status(400).json({ error: message });
}

app.post("/api/auth/register", async (req, res) => {
  try {
    const { email, username, password, displayName } = req.body as {
      email?: string;
      username?: string;
      password?: string;
      displayName?: string;
    };
    const user = await registerUser({
      email: email ?? "",
      username: username ?? "",
      password: password ?? "",
      displayName: displayName ?? "",
    });
    const token = createSession(user.id);
    updateUserStatus(user.id, "online");
    res.json({ token, user: getAccountUser(user.id) });
  } catch (err) {
    handleError(res, err);
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { login, password } = req.body as { login?: string; password?: string };
    if (!login || !password) {
      res.status(400).json({ error: "Kullanıcı adı ve şifre gerekli" });
      return;
    }
    const user = await loginUser(login, password);
    const token = createSession(user.id);
    updateUserStatus(user.id, "online");
    res.json({ token, user: getAccountUser(user.id) });
  } catch (err) {
    handleError(res, err);
  }
});

app.post("/api/auth/logout", authMiddleware, (req, res) => {
  const userId = (req as AuthedRequest).userId;
  updateUserStatus(userId, "offline");
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (token) sessions.delete(token);
  res.json({ ok: true });
});

app.get("/api/auth/me", authMiddleware, (req, res) => {
  const user = getAccountUser((req as AuthedRequest).userId);
  if (!user) {
    res.status(404).json({ error: "Kullanıcı bulunamadı" });
    return;
  }
  res.json(user);
});

app.patch("/api/users/me", authMiddleware, (req, res) => {
  try {
    const userId = (req as AuthedRequest).userId;
    const { statusText, status, name, avatar, banner, bio, accentColor } = req.body as {
      statusText?: string;
      status?: Status;
      name?: string;
      avatar?: string;
      banner?: string;
      bio?: string;
      accentColor?: string;
    };
    const user = updateUserProfile(userId, {
      statusText,
      status,
      name,
      avatar,
      banner,
      bio,
      accentColor,
    });
    if (!user) {
      res.status(404).json({ error: "Kullanıcı bulunamadı" });
      return;
    }
    io.emit("presence:update", { userId, user });
    res.json(user);
  } catch (err) {
    handleError(res, err);
  }
});

app.post("/api/users/me/upload", authMiddleware, (req, res) => {
  try {
    const userId = (req as AuthedRequest).userId;
    const { kind, dataUrl } = req.body as { kind?: string; dataUrl?: string };
    if (kind !== "avatar" && kind !== "banner") {
      res.status(400).json({ error: "Geçersiz yükleme türü" });
      return;
    }
    if (!dataUrl || typeof dataUrl !== "string") {
      res.status(400).json({ error: "Görsel gerekli" });
      return;
    }
    const url = saveUserImage(userId, kind, dataUrl);
    const user = updateUserProfile(userId, kind === "avatar" ? { avatar: url } : { banner: url });
    if (!user) {
      res.status(404).json({ error: "Kullanıcı bulunamadı" });
      return;
    }
    io.emit("presence:update", { userId, user: getUserById(userId) });
    res.json(user);
  } catch (err) {
    handleError(res, err);
  }
});

app.patch("/api/users/me/settings", authMiddleware, (req, res) => {
  try {
    const userId = (req as AuthedRequest).userId;
    const user = updateUserSettings(userId, req.body as Partial<UserSettings>);
    if (!user) {
      res.status(404).json({ error: "Kullanıcı bulunamadı" });
      return;
    }
    res.json(user);
  } catch (err) {
    handleError(res, err);
  }
});

app.post("/api/users/me/password", authMiddleware, async (req, res) => {
  try {
    const userId = (req as AuthedRequest).userId;
    const { currentPassword, newPassword } = req.body as {
      currentPassword?: string;
      newPassword?: string;
    };
    if (!currentPassword || !newPassword) {
      res.status(400).json({ error: "Mevcut ve yeni şifre gerekli" });
      return;
    }
    await changeUserPassword(userId, currentPassword, newPassword);
    res.json({ ok: true });
  } catch (err) {
    handleError(res, err);
  }
});

app.delete("/api/users/me", authMiddleware, async (req, res) => {
  try {
    const userId = (req as AuthedRequest).userId;
    const { password } = req.body as { password?: string };
    if (!password) {
      res.status(400).json({ error: "Şifre gerekli" });
      return;
    }
    await deleteUserAccount(userId, password);
    revokeUserSessions(userId);
    res.json({ ok: true });
  } catch (err) {
    handleError(res, err);
  }
});

app.get("/api/users/search", authMiddleware, (req, res) => {
  const userId = (req as AuthedRequest).userId;
  const q = (req.query.q as string) ?? "";
  res.json(searchUsers(q, userId));
});

app.get("/api/users/:userId/profile", authMiddleware, (req, res) => {
  try {
    const viewerId = (req as AuthedRequest).userId;
    res.json(getUserProfile(viewerId, req.params.userId as string));
  } catch (err) {
    handleError(res, err);
  }
});

app.get("/api/friends", authMiddleware, (req, res) => {
  res.json(getFriends((req as AuthedRequest).userId));
});

app.get("/api/friends/pending", authMiddleware, (req, res) => {
  res.json(getPendingFriends((req as AuthedRequest).userId));
});

app.get("/api/friends/blocked", authMiddleware, (req, res) => {
  res.json(getBlockedUsers((req as AuthedRequest).userId));
});

app.post("/api/friends/request", authMiddleware, (req, res) => {
  try {
    const userId = (req as AuthedRequest).userId;
    const { username } = req.body as { username?: string };
    if (!username) {
      res.status(400).json({ error: "Kullanıcı adı gerekli" });
      return;
    }
    const target = sendFriendRequest(userId, username);
    io.to(`user:${target.id}`).emit("friend:request", { from: getUserById(userId) });
    res.json(target);
  } catch (err) {
    handleError(res, err);
  }
});

app.post("/api/friends/accept", authMiddleware, (req, res) => {
  try {
    const userId = (req as AuthedRequest).userId;
    const { userId: requesterId } = req.body as { userId?: string };
    if (!requesterId) {
      res.status(400).json({ error: "Kullanıcı gerekli" });
      return;
    }
    const friend = acceptFriendRequest(userId, requesterId);
    io.to(`user:${requesterId}`).emit("friend:accepted", { user: getUserById(userId) });
    res.json(friend);
  } catch (err) {
    handleError(res, err);
  }
});

app.post("/api/friends/decline", authMiddleware, (req, res) => {
  try {
    declineFriendRequest((req as AuthedRequest).userId, (req.body as { userId: string }).userId);
    res.json({ ok: true });
  } catch (err) {
    handleError(res, err);
  }
});

app.post("/api/friends/cancel", authMiddleware, (req, res) => {
  try {
    cancelFriendRequest((req as AuthedRequest).userId, (req.body as { userId: string }).userId);
    res.json({ ok: true });
  } catch (err) {
    handleError(res, err);
  }
});

app.post("/api/friends/block", authMiddleware, (req, res) => {
  try {
    blockUser((req as AuthedRequest).userId, (req.body as { userId: string }).userId);
    res.json({ ok: true });
  } catch (err) {
    handleError(res, err);
  }
});

app.post("/api/friends/unblock", authMiddleware, (req, res) => {
  try {
    unblockUser((req as AuthedRequest).userId, (req.body as { userId: string }).userId);
    res.json({ ok: true });
  } catch (err) {
    handleError(res, err);
  }
});

app.delete("/api/friends/:friendId", authMiddleware, (req, res) => {
  try {
    removeFriend((req as AuthedRequest).userId, req.params.friendId as string);
    res.json({ ok: true });
  } catch (err) {
    handleError(res, err);
  }
});

app.get("/api/gifs/trending", authMiddleware, async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 24;
    res.json(await trendingGifs(limit));
  } catch (err) {
    handleError(res, err);
  }
});

app.get("/api/gifs/search", authMiddleware, async (req, res) => {
  try {
    const q = (req.query.q as string) ?? "";
    const limit = Number(req.query.limit) || 24;
    res.json(await searchGifs(q, limit));
  } catch (err) {
    handleError(res, err);
  }
});

app.get("/api/servers", authMiddleware, (req, res) => {
  res.json(getUserServers((req as AuthedRequest).userId));
});

app.post("/api/servers", authMiddleware, (req, res) => {
  try {
    const userId = (req as AuthedRequest).userId;
    const { name } = req.body as { name?: string };
    if (!name) {
      res.status(400).json({ error: "Sunucu adı gerekli" });
      return;
    }
    res.json(createServerRecord(userId, name));
  } catch (err) {
    handleError(res, err);
  }
});

app.post("/api/servers/join", authMiddleware, (req, res) => {
  try {
    const userId = (req as AuthedRequest).userId;
    const { inviteCode } = req.body as { inviteCode?: string };
    if (!inviteCode) {
      res.status(400).json({ error: "Davet kodu gerekli" });
      return;
    }
    res.json(joinServer(userId, inviteCode));
  } catch (err) {
    handleError(res, err);
  }
});

app.post("/api/servers/:serverId/leave", authMiddleware, (req, res) => {
  try {
    const userId = (req as AuthedRequest).userId;
    leaveServer(userId, req.params.serverId as string);
    res.json({ ok: true });
  } catch (err) {
    handleError(res, err);
  }
});

app.get("/api/servers/:serverId", authMiddleware, (req, res) => {
  const server = getServerById(req.params.serverId as string);
  if (!server) {
    res.status(404).json({ error: "Sunucu bulunamadı" });
    return;
  }
  res.json(server);
});

app.patch("/api/servers/:serverId", authMiddleware, (req, res) => {
  try {
    const userId = (req as AuthedRequest).userId;
    const { name, icon, banner, description } = req.body as {
      name?: string;
      icon?: string;
      banner?: string;
      description?: string;
    };
    res.json(
      updateServerSettings(req.params.serverId as string, userId, {
        name,
        icon,
        banner,
        description,
      }),
    );
  } catch (err) {
    handleError(res, err);
  }
});

app.post("/api/servers/:serverId/upload", authMiddleware, (req, res) => {
  try {
    const userId = (req as AuthedRequest).userId;
    const serverId = req.params.serverId as string;
    const { kind, dataUrl } = req.body as { kind?: string; dataUrl?: string };
    if (kind !== "icon" && kind !== "banner") {
      res.status(400).json({ error: "Geçersiz yükleme türü" });
      return;
    }
    if (!dataUrl || typeof dataUrl !== "string") {
      res.status(400).json({ error: "Görsel gerekli" });
      return;
    }
    const url = saveServerImage(serverId, kind, dataUrl);
    const server = updateServerSettings(
      serverId,
      userId,
      kind === "icon" ? { icon: url } : { banner: url },
    );
    res.json(server);
  } catch (err) {
    handleError(res, err);
  }
});

app.post("/api/servers/:serverId/invite/regenerate", authMiddleware, (req, res) => {
  try {
    const userId = (req as AuthedRequest).userId;
    res.json(regenerateServerInvite(req.params.serverId as string, userId));
  } catch (err) {
    handleError(res, err);
  }
});

app.get("/api/servers/:serverId/channels", authMiddleware, (req, res) => {
  try {
    res.json(getServerChannels(req.params.serverId as string, (req as AuthedRequest).userId));
  } catch (err) {
    handleError(res, err);
  }
});

app.post("/api/servers/:serverId/channels", authMiddleware, (req, res) => {
  try {
    const userId = (req as AuthedRequest).userId;
    const { name } = req.body as { name?: string };
    if (!name) {
      res.status(400).json({ error: "Kanal adı gerekli" });
      return;
    }
    res.json(createChannel(req.params.serverId as string, userId, name));
  } catch (err) {
    handleError(res, err);
  }
});

app.get("/api/servers/:serverId/members", authMiddleware, (req, res) => {
  try {
    res.json(getServerMembers(req.params.serverId as string, (req as AuthedRequest).userId));
  } catch (err) {
    handleError(res, err);
  }
});

app.get("/api/channels/:channelId/messages", authMiddleware, (req, res) => {
  try {
    res.json(getChannelMessages(req.params.channelId as string, (req as AuthedRequest).userId));
  } catch (err) {
    handleError(res, err);
  }
});

app.get("/api/dms", authMiddleware, (req, res) => {
  res.json(getDmPartners((req as AuthedRequest).userId));
});

app.get("/api/messages/:partnerId", authMiddleware, (req, res) => {
  try {
    res.json(getDmMessages((req as AuthedRequest).userId, req.params.partnerId as string));
  } catch (err) {
    handleError(res, err);
  }
});

app.get("/api/message-requests", authMiddleware, (req, res) => {
  res.json(getMessageRequests((req as AuthedRequest).userId));
});

app.post("/api/message-requests/:id/accept", authMiddleware, (req, res) => {
  try {
    const userId = (req as AuthedRequest).userId;
    const result = acceptMessageRequest(userId, req.params.id as string);
    io.to(`user:${result.partnerId}`).emit("dm:new", {
      partnerId: userId,
      message: result.forSender,
    });
    res.json({ partnerId: result.partnerId, message: result.forAcceptor });
  } catch (err) {
    handleError(res, err);
  }
});

app.post("/api/message-requests/:id/decline", authMiddleware, (req, res) => {
  try {
    declineMessageRequest((req as AuthedRequest).userId, req.params.id as string);
    res.json({ ok: true });
  } catch (err) {
    handleError(res, err);
  }
});

app.get("/api/group-dms", authMiddleware, (req, res) => {
  res.json(getUserGroupDms((req as AuthedRequest).userId));
});

app.post("/api/group-dms", authMiddleware, (req, res) => {
  try {
    const userId = (req as AuthedRequest).userId;
    const { memberIds, name } = req.body as { memberIds?: string[]; name?: string };
    if (!memberIds || !Array.isArray(memberIds) || memberIds.length === 0) {
      res.status(400).json({ error: "Üye listesi gerekli" });
      return;
    }
    const group = createGroupDm(userId, memberIds, name);
    for (const member of group.members) {
      io.to(`user:${member.id}`).emit("group-dm:new", { group });
    }
    res.json(group);
  } catch (err) {
    handleError(res, err);
  }
});

app.get("/api/group-dms/:groupId/messages", authMiddleware, (req, res) => {
  try {
    res.json(getGroupDmMessages(req.params.groupId as string, (req as AuthedRequest).userId));
  } catch (err) {
    handleError(res, err);
  }
});

app.get("/api/group-dms/:groupId", authMiddleware, (req, res) => {
  try {
    const group = getGroupDmById(req.params.groupId as string, (req as AuthedRequest).userId);
    if (!group) {
      res.status(404).json({ error: "Grup bulunamadı" });
      return;
    }
    res.json(group);
  } catch (err) {
    handleError(res, err);
  }
});

app.get("/api/chats/:chatId/pins", authMiddleware, (req, res) => {
  try {
    const userId = (req as AuthedRequest).userId;
    const ids = getPinnedMessageIds(userId, req.params.chatId as string);
    res.json({ pinnedIds: ids });
  } catch (err) {
    handleError(res, err);
  }
});

app.post("/api/chats/:chatId/pins", authMiddleware, (req, res) => {
  try {
    const userId = (req as AuthedRequest).userId;
    const { messageId } = req.body as { messageId?: string };
    if (!messageId) {
      res.status(400).json({ error: "messageId gerekli" });
      return;
    }
    const pinnedIds = pinChatMessage(userId, req.params.chatId as string, messageId);
    const chatId = req.params.chatId as string;
    const targets = getReactionBroadcastTargets(chatId, userId);
    for (const targetId of targets) {
      io.to(`user:${targetId}`).emit("chat:pins", { chatId, pinnedIds });
    }
    res.json({ pinnedIds });
  } catch (err) {
    handleError(res, err);
  }
});

app.delete("/api/chats/:chatId/pins/:messageId", authMiddleware, (req, res) => {
  try {
    const userId = (req as AuthedRequest).userId;
    const chatId = req.params.chatId as string;
    const pinnedIds = unpinChatMessage(userId, chatId, req.params.messageId as string);
    const targets = getReactionBroadcastTargets(chatId, userId);
    for (const targetId of targets) {
      io.to(`user:${targetId}`).emit("chat:pins", { chatId, pinnedIds });
    }
    res.json({ pinnedIds });
  } catch (err) {
    handleError(res, err);
  }
});

app.post("/api/chats/:chatId/messages/:messageId/reactions", authMiddleware, (req, res) => {
  try {
    const userId = (req as AuthedRequest).userId;
    const chatId = req.params.chatId as string;
    const messageId = req.params.messageId as string;
    const { emoji } = req.body as { emoji?: string };
    if (!emoji?.trim()) {
      res.status(400).json({ error: "emoji gerekli" });
      return;
    }
    const { reactions } = toggleMessageReaction(userId, chatId, messageId, emoji);
    const targets = getReactionBroadcastTargets(chatId, userId);
    for (const targetId of targets) {
      io.to(`user:${targetId}`).emit("message:reaction", {
        chatId,
        messageId,
        reactions,
      });
    }
    res.json({ reactions });
  } catch (err) {
    handleError(res, err);
  }
});

io.use((socket, next) => {
  const token = socket.handshake.auth.token as string | undefined;
  const userId = getUserIdFromToken(token);
  if (!userId) {
    next(new Error("Unauthorized"));
    return;
  }
  socket.data.userId = userId;
  next();
});

io.on("connection", (socket) => {
  const userId = socket.data.userId as string;
  socket.join(`user:${userId}`);

  if (!onlineUsers.has(userId)) onlineUsers.set(userId, new Set());
  onlineUsers.get(userId)!.add(socket.id);

  updateUserStatus(userId, "online");
  const user = getUserById(userId);
  if (user) io.emit("presence:update", { userId, user });

  socket.on("channel:join", (channelId: string) => {
    const channel = getChannelById(channelId);
    if (!channel) return;
    try {
      getChannelMessages(channelId, userId);
      socket.join(`channel:${channelId}`);
    } catch {
      /* ignore */
    }
  });

  socket.on("channel:leave", (channelId: string) => {
    socket.leave(`channel:${channelId}`);
  });

  socket.on("dm:send", ({
    recipientId,
    content,
    replyToId,
  }: {
    recipientId: string;
    content: string;
    replyToId?: string;
  }) => {
    try {
      if (!content.trim() || !recipientId) return;
      const result = sendDirectOrRequest(userId, recipientId, content.trim(), replyToId);
      if (result.type === "dm") {
        socket.emit("dm:new", { partnerId: recipientId, message: result.forSender });
        io.to(`user:${recipientId}`).emit("dm:new", { partnerId: userId, message: result.forRecipient });
      } else {
        io.to(`user:${recipientId}`).emit("message-request:new", { request: result.request });
      }
    } catch {
      /* ignore */
    }
  });

  socket.on("group-dm:join", (groupId: string) => {
    const group = getGroupDmById(groupId, userId);
    if (group) socket.join(`group-dm:${groupId}`);
  });

  socket.on("group-dm:leave", (groupId: string) => {
    socket.leave(`group-dm:${groupId}`);
  });

  socket.on("group-dm:send", ({
    groupId,
    content,
    replyToId,
  }: {
    groupId: string;
    content: string;
    replyToId?: string;
  }) => {
    try {
      if (!content.trim() || !groupId) return;
      const result = insertGroupDmMessage(groupId, userId, content.trim(), replyToId);
      for (const target of result.broadcast) {
        io.to(`user:${target.userId}`).emit("group-dm:new", {
          groupId,
          message: target.message,
          author: getUserById(userId),
        });
      }
    } catch {
      /* ignore */
    }
  });

  socket.on("channel:send", ({
    channelId,
    content,
    replyToId,
  }: {
    channelId: string;
    content: string;
    replyToId?: string;
  }) => {
    try {
      if (!content.trim() || !channelId) return;
      const result = insertChannelMessage(channelId, userId, content.trim(), replyToId);
      for (const target of result.broadcast) {
        io.to(`user:${target.userId}`).emit("channel:new", {
          channelId,
          serverId: getChannelById(channelId)?.serverId,
          message: target.message,
          author: getUserById(userId),
        });
      }
    } catch {
      /* ignore */
    }
  });

  socket.on(
    "message:react",
    ({
      chatId,
      messageId,
      emoji,
    }: {
      chatId: string;
      messageId: string;
      emoji: string;
    }) => {
      try {
        if (!chatId || !messageId || !emoji?.trim()) return;
        const { reactions } = toggleMessageReaction(userId, chatId, messageId, emoji);
        const targets = getReactionBroadcastTargets(chatId, userId);
        for (const targetId of targets) {
          io.to(`user:${targetId}`).emit("message:reaction", {
            chatId,
            messageId,
            reactions,
          });
        }
      } catch {
        /* ignore */
      }
    },
  );

  socket.on("presence:set", ({ status }: { status: Status }) => {
    const updated = updateUserProfile(userId, { status });
    if (updated) io.emit("presence:update", { userId, user: updated });
  });

  socket.on("disconnect", () => {
    const sockets = onlineUsers.get(userId);
    sockets?.delete(socket.id);

    if (!sockets || sockets.size === 0) {
      onlineUsers.delete(userId);
      updateUserStatus(userId, "offline");
      const updated = getUserById(userId);
      if (updated) io.emit("presence:update", { userId, user: updated });
    }
  });
});

const PORT = 3001;
httpServer.listen(PORT, () => {
  console.log(`Hiqu server running on http://localhost:${PORT}`);
});
