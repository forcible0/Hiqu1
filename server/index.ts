import { randomUUID } from "node:crypto";
import { createServer } from "node:http";
import cors from "cors";
import express from "express";
import { Server } from "socket.io";
import {
  acceptFriendRequest,
  blockUser,
  cancelFriendRequest,
  createChannel,
  createServer as createServerRecord,
  declineFriendRequest,
  getBlockedUsers,
  getChannelById,
  getChannelMessages,
  getDmMessages,
  getDmPartners,
  getFriends,
  getPendingFriends,
  getServerById,
  getServerChannels,
  getServerMembers,
  getUserById,
  getUserServers,
  initDb,
  insertChannelMessage,
  insertDmMessage,
  joinServer,
  loginUser,
  registerUser,
  removeFriend,
  searchUsers,
  sendFriendRequest,
  unblockUser,
  updateUserProfile,
  updateUserStatus,
} from "./db.js";
import type { Status } from "./types.js";

initDb();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: ["http://localhost:5173", "http://127.0.0.1:5173"], credentials: true },
});

app.use(cors({ origin: ["http://localhost:5173", "http://127.0.0.1:5173"], credentials: true }));
app.use(express.json());

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
    res.json({ token, user: getUserById(user.id) });
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
    res.json({ token, user: getUserById(user.id) });
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
  const user = getUserById((req as AuthedRequest).userId);
  if (!user) {
    res.status(404).json({ error: "Kullanıcı bulunamadı" });
    return;
  }
  res.json(user);
});

app.patch("/api/users/me", authMiddleware, (req, res) => {
  try {
    const userId = (req as AuthedRequest).userId;
    const { statusText, status, name } = req.body as {
      statusText?: string;
      status?: Status;
      name?: string;
    };
    const user = updateUserProfile(userId, { statusText, status, name });
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

app.get("/api/users/search", authMiddleware, (req, res) => {
  const userId = (req as AuthedRequest).userId;
  const q = (req.query.q as string) ?? "";
  res.json(searchUsers(q, userId));
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

app.get("/api/servers/:serverId", authMiddleware, (req, res) => {
  const server = getServerById(req.params.serverId as string);
  if (!server) {
    res.status(404).json({ error: "Sunucu bulunamadı" });
    return;
  }
  res.json(server);
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

  socket.on("dm:send", ({ recipientId, content }: { recipientId: string; content: string }) => {
    try {
      if (!content.trim() || !recipientId) return;
      const { forSender, forRecipient } = insertDmMessage(userId, recipientId, content.trim());
      socket.emit("dm:new", { partnerId: recipientId, message: forSender });
      io.to(`user:${recipientId}`).emit("dm:new", { partnerId: userId, message: forRecipient });
    } catch {
      /* ignore */
    }
  });

  socket.on("channel:send", ({ channelId, content }: { channelId: string; content: string }) => {
    try {
      if (!content.trim() || !channelId) return;
      const result = insertChannelMessage(channelId, userId, content.trim());
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
