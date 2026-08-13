import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { io, type Socket } from "socket.io-client";
import * as api from "../api/client";
import type {
  AccountUser,
  Channel,
  FriendRequest,
  FriendsTab,
  GroupDm,
  ForwardDestination,
  Message,
  MessageRequest,
  ModalType,
  Server,
  SettingsTab,
  Status,
  User,
  UserSettings,
  View,
} from "../types";
import { applyTheme } from "../lib/settings";
import { patchMessageReactions } from "../lib/message-utils";

interface AppState {
  token: string | null;
  currentUser: AccountUser | null;
  friends: User[];
  pending: FriendRequest[];
  blocked: User[];
  dmPartners: User[];
  groupDms: GroupDm[];
  messageRequests: MessageRequest[];
  servers: Server[];
  channels: Channel[];
  serverMembers: User[];
  dmMessages: Record<string, Message[]>;
  groupDmMessages: Record<string, Message[]>;
  channelMessages: Record<string, Message[]>;
  chatPins: Record<string, string[]>;
  view: View;
  friendsTab: FriendsTab;
  activeDmId: string | null;
  activeGroupDmId: string | null;
  activeServerId: string;
  activeChannelId: string | null;
  activeModal: ModalType;
  settingsTab: SettingsTab;
  loading: boolean;
  register: (data: {
    email: string;
    username: string;
    password: string;
    displayName: string;
  }) => Promise<void>;
  login: (login: string, password: string, remember?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  refreshFriends: () => Promise<void>;
  setView: (view: View) => void;
  setFriendsTab: (tab: FriendsTab) => void;
  setActiveModal: (modal: ModalType, settingsTab?: SettingsTab) => void;
  openHome: () => void;
  openFriends: () => void;
  openMessageRequests: () => void;
  openDm: (userId: string) => void;
  openGroupDm: (groupId: string) => void;
  openServer: (serverId: string) => Promise<void>;
  openChannel: (channelId: string) => Promise<void>;
  sendDm: (recipientId: string, content: string, replyToId?: string) => void;
  sendGroupDm: (groupId: string, content: string, replyToId?: string) => void;
  sendChannelMessage: (channelId: string, content: string, replyToId?: string) => void;
  loadChatPins: (chatId: string) => Promise<void>;
  pinMessage: (chatId: string, messageId: string) => Promise<void>;
  unpinMessage: (chatId: string, messageId: string) => Promise<void>;
  toggleReaction: (chatId: string, messageId: string, emoji: string) => void;
  forwardMessage: (content: string, dest: ForwardDestination) => void;
  createGroupDm: (memberIds: string[], name?: string) => Promise<GroupDm>;
  acceptMessageRequest: (requestId: string) => Promise<void>;
  declineMessageRequest: (requestId: string) => Promise<void>;
  refreshMessageRequests: () => Promise<void>;
  sendFriendRequest: (username: string) => Promise<void>;
  acceptFriend: (userId: string) => Promise<void>;
  declineFriend: (userId: string) => Promise<void>;
  cancelFriendRequest: (userId: string) => Promise<void>;
  blockUser: (userId: string) => Promise<void>;
  unblockUser: (userId: string) => Promise<void>;
  removeFriend: (friendId: string) => Promise<void>;
  createServer: (name: string) => Promise<Server>;
  joinServer: (inviteCode: string) => Promise<Server>;
  leaveServer: (serverId: string) => Promise<void>;
  createChannel: (name: string) => Promise<void>;
  updateProfile: (data: {
    statusText?: string;
    status?: Status;
    name?: string;
    avatar?: string;
    banner?: string;
    bio?: string;
    accentColor?: string;
  }) => Promise<void>;
  uploadProfileImage: (kind: "avatar" | "banner", dataUrl: string) => Promise<AccountUser>;
  updateSettings: (settings: Partial<UserSettings>) => Promise<void>;
  changePassword: (current: string, next: string) => Promise<void>;
  deleteAccount: (password: string) => Promise<void>;
  updateServerSettings: (
    data: { name?: string; icon?: string; banner?: string; description?: string },
  ) => Promise<Server>;
  uploadServerImage: (kind: "icon" | "banner", dataUrl: string) => Promise<Server>;
  regenerateServerInvite: () => Promise<Server>;
  searchUsers: (q: string) => Promise<User[]>;
}

const AppContext = createContext<AppState | null>(null);
const TOKEN_KEY = "hiqu_token";
const SESSION_TOKEN_KEY = "hiqu_session_token";

function readStoredToken() {
  return localStorage.getItem(TOKEN_KEY) ?? sessionStorage.getItem(SESSION_TOKEN_KEY);
}

function clearStoredTokens() {
  localStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(SESSION_TOKEN_KEY);
}

function persistToken(newToken: string, remember: boolean) {
  if (remember) {
    localStorage.setItem(TOKEN_KEY, newToken);
    localStorage.setItem("hiqu_remember_me", "1");
    sessionStorage.removeItem(SESSION_TOKEN_KEY);
  } else {
    sessionStorage.setItem(SESSION_TOKEN_KEY, newToken);
    localStorage.setItem("hiqu_remember_me", "0");
    localStorage.removeItem(TOKEN_KEY);
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => readStoredToken());
  const [currentUser, setCurrentUser] = useState<AccountUser | null>(null);
  const [friends, setFriends] = useState<User[]>([]);
  const [pending, setPending] = useState<FriendRequest[]>([]);
  const [blocked, setBlocked] = useState<User[]>([]);
  const [dmPartners, setDmPartners] = useState<User[]>([]);
  const [groupDms, setGroupDms] = useState<GroupDm[]>([]);
  const [messageRequests, setMessageRequests] = useState<MessageRequest[]>([]);
  const [servers, setServers] = useState<Server[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [serverMembers, setServerMembers] = useState<User[]>([]);
  const [dmMessages, setDmMessages] = useState<Record<string, Message[]>>({});
  const [groupDmMessages, setGroupDmMessages] = useState<Record<string, Message[]>>({});
  const [channelMessages, setChannelMessages] = useState<Record<string, Message[]>>({});
  const [chatPins, setChatPins] = useState<Record<string, string[]>>({});
  const [view, setView] = useState<View>("friends");
  const [friendsTab, setFriendsTab] = useState<FriendsTab>("online");
  const [activeDmId, setActiveDmId] = useState<string | null>(null);
  const [activeGroupDmId, setActiveGroupDmId] = useState<string | null>(null);
  const [activeServerId, setActiveServerId] = useState("home");
  const [activeChannelId, setActiveChannelId] = useState<string | null>(null);
  const [activeModal, setActiveModalState] = useState<ModalType>(null);
  const [settingsTab, setSettingsTab] = useState<SettingsTab>("account");
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState<Socket | null>(null);
  const currentUserRef = useRef<AccountUser | null>(null);
  currentUserRef.current = currentUser;

  const applyReaction = useCallback(
    (
      chatId: string,
      messageId: string,
      reactions: { emoji: string; userIds: string[] }[],
    ) => {
      const userId = currentUserRef.current?.id;
      if (!userId) return;
      if (chatId.startsWith("dm-")) {
        const partnerId = chatId.slice(3);
        setDmMessages((prev) => ({
          ...prev,
          [partnerId]: patchMessageReactions(prev[partnerId] ?? [], messageId, reactions, userId),
        }));
      } else if (chatId.startsWith("group-")) {
        const groupId = chatId.slice(6);
        setGroupDmMessages((prev) => ({
          ...prev,
          [groupId]: patchMessageReactions(prev[groupId] ?? [], messageId, reactions, userId),
        }));
      } else if (chatId.startsWith("channel-")) {
        const channelId = chatId.slice(8);
        setChannelMessages((prev) => ({
          ...prev,
          [channelId]: patchMessageReactions(prev[channelId] ?? [], messageId, reactions, userId),
        }));
      }
    },
    [],
  );

  const loadChatPins = useCallback(
    async (chatId: string) => {
      if (!token) return;
      try {
        const { pinnedIds } = await api.fetchChatPins(token, chatId);
        setChatPins((prev) => ({ ...prev, [chatId]: pinnedIds }));
      } catch {
        /* ignore */
      }
    },
    [token],
  );

  const setActiveModal = useCallback((modal: ModalType, tab: SettingsTab = "account") => {
    setSettingsTab(tab);
    setActiveModalState(modal);
  }, []);

  const refreshMessageRequests = useCallback(async () => {
    if (!token) return;
    const requests = await api.fetchMessageRequests(token);
    setMessageRequests(requests);
  }, [token]);

  const refreshFriends = useCallback(async () => {
    if (!token) return;
    const [f, p, b, dms, groups] = await Promise.all([
      api.fetchFriends(token),
      api.fetchPending(token),
      api.fetchBlocked(token),
      api.fetchDmPartners(token),
      api.fetchGroupDms(token),
    ]);
    setFriends(f);
    setPending(p);
    setBlocked(b);
    setDmPartners(dms);
    setGroupDms(groups);
    await refreshMessageRequests();
  }, [token, refreshMessageRequests]);

  const loadInitial = useCallback(
    async (authToken: string) => {
      const [me, userServers] = await Promise.all([
        api.fetchMe(authToken),
        api.fetchServers(authToken),
      ]);
    setCurrentUser(me);
    setServers(userServers);
    applyTheme(me.settings.theme);
    await refreshFriends();
    },
    [refreshFriends],
  );

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        await loadInitial(token);
        if (cancelled) return;

        const s = io({ auth: { token } });
        setSocket(s);

        s.on("dm:new", ({ partnerId, message }: { partnerId: string; message: Message }) => {
          setDmMessages((prev) => ({
            ...prev,
            [partnerId]: [...(prev[partnerId] ?? []), message],
          }));
          refreshFriends();
        });

        s.on("message-request:new", () => {
          refreshMessageRequests();
        });

        s.on(
          "group-dm:new",
          ({
            groupId,
            message,
            group,
          }: {
            groupId?: string;
            message?: Message;
            group?: GroupDm;
          }) => {
            if (group) {
              setGroupDms((prev) => (prev.some((g) => g.id === group.id) ? prev : [group, ...prev]));
            }
            if (groupId && message) {
              setGroupDmMessages((prev) => ({
                ...prev,
                [groupId]: [...(prev[groupId] ?? []), message],
              }));
            }
          },
        );

        s.on(
          "channel:new",
          ({
            channelId,
            message,
          }: {
            channelId: string;
            message: Message;
          }) => {
            setChannelMessages((prev) => ({
              ...prev,
              [channelId]: [...(prev[channelId] ?? []), message],
            }));
          },
        );

        s.on("presence:update", ({ user }: { user: User }) => {
          const patch = (list: User[]) => list.map((u) => (u.id === user.id ? { ...u, ...user } : u));
          setFriends(patch);
          setDmPartners(patch);
          setServerMembers(patch);
          setCurrentUser((me) => (me?.id === user.id ? { ...me, ...user } : me));
        });

        s.on("friend:request", () => {
          refreshFriends();
        });
        s.on("friend:accepted", () => refreshFriends());

        s.on(
          "message:reaction",
          ({
            chatId,
            messageId,
            reactions,
          }: {
            chatId: string;
            messageId: string;
            reactions: { emoji: string; userIds: string[] }[];
          }) => {
            applyReaction(chatId, messageId, reactions);
          },
        );

        s.on("chat:pins", ({ chatId, pinnedIds }: { chatId: string; pinnedIds: string[] }) => {
          setChatPins((prev) => ({ ...prev, [chatId]: pinnedIds }));
        });
      } catch {
        clearStoredTokens();
        setToken(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token, loadInitial, refreshFriends, refreshMessageRequests, applyReaction]);

  useEffect(() => {
    return () => {
      socket?.disconnect();
    };
  }, [socket]);

  const authSuccess = useCallback((newToken: string, user: AccountUser, remember = true) => {
    persistToken(newToken, remember);
    setToken(newToken);
    setCurrentUser(user);
    setLoading(true);
  }, []);

  const register = useCallback(
    async (data: {
      email: string;
      username: string;
      password: string;
      displayName: string;
    }) => {
      const { token: newToken, user } = await api.register(data);
      authSuccess(newToken, user, true);
    },
    [authSuccess],
  );

  const login = useCallback(
    async (loginValue: string, password: string, remember = true) => {
      const { token: newToken, user } = await api.login(loginValue, password);
      authSuccess(newToken, user, remember);
    },
    [authSuccess],
  );

  const logout = useCallback(async () => {
    if (token) await api.logout(token).catch(() => undefined);
    socket?.disconnect();
    clearStoredTokens();
    setToken(null);
    setCurrentUser(null);
    setFriends([]);
    setPending([]);
    setBlocked([]);
    setDmPartners([]);
    setGroupDms([]);
    setMessageRequests([]);
    setServers([]);
    setChannels([]);
    setDmMessages({});
    setGroupDmMessages({});
    setChannelMessages({});
    setChatPins({});
    setSocket(null);
    setActiveServerId("home");
    setActiveGroupDmId(null);
    setView("friends");
  }, [socket, token]);

  const openFriends = useCallback(() => {
    setActiveServerId("home");
    setActiveChannelId(null);
    setActiveDmId(null);
    setActiveGroupDmId(null);
    setView("friends");
  }, []);

  const openMessageRequests = useCallback(() => {
    setActiveServerId("home");
    setActiveChannelId(null);
    setActiveDmId(null);
    setActiveGroupDmId(null);
    setView("message-requests");
    refreshMessageRequests();
  }, [refreshMessageRequests]);

  const openHome = useCallback(() => {
    setActiveServerId("home");
    setActiveChannelId(null);
    setActiveGroupDmId((groupId) => {
      setActiveDmId((dmId) => {
        if (groupId) setView("group-dm");
        else if (dmId) setView("dm");
        else setView("friends");
        return dmId;
      });
      return groupId;
    });
  }, []);

  const openDm = useCallback(
    async (userId: string) => {
      if (!token) return;
      setActiveServerId("home");
      setActiveChannelId(null);
      setActiveGroupDmId(null);
      if (activeGroupDmId) socket?.emit("group-dm:leave", activeGroupDmId);
      setActiveDmId(userId);
      setView("dm");
      const msgs = await api.fetchDmMessages(token, userId);
      setDmMessages((prev) => ({ ...prev, [userId]: msgs }));
      await loadChatPins(`dm-${userId}`);
    },
    [token, activeGroupDmId, socket, loadChatPins],
  );

  const openGroupDm = useCallback(
    async (groupId: string) => {
      if (!token) return;
      setActiveServerId("home");
      setActiveChannelId(null);
      setActiveDmId(null);
      if (activeGroupDmId && activeGroupDmId !== groupId) {
        socket?.emit("group-dm:leave", activeGroupDmId);
      }
      setActiveGroupDmId(groupId);
      setView("group-dm");
      socket?.emit("group-dm:join", groupId);
      const msgs = await api.fetchGroupDmMessages(token, groupId);
      setGroupDmMessages((prev) => ({ ...prev, [groupId]: msgs }));
      await loadChatPins(`group-${groupId}`);
    },
    [token, activeGroupDmId, socket, loadChatPins],
  );

  const openServer = useCallback(
    async (serverId: string) => {
      if (!token || serverId === "home") {
        openHome();
        return;
      }
      setActiveServerId(serverId);
      setActiveDmId(null);
      setActiveGroupDmId(null);
      const [chs, members] = await Promise.all([
        api.fetchChannels(token, serverId),
        api.fetchServerMembers(token, serverId),
      ]);
      setChannels(chs);
      setServerMembers(members);
      if (chs.length > 0) {
        const first = chs[0]!;
        setActiveChannelId(first.id);
        setView("channel");
        socket?.emit("channel:join", first.id);
        const msgs = await api.fetchChannelMessages(token, first.id);
        setChannelMessages((prev) => ({ ...prev, [first.id]: msgs }));
        await loadChatPins(`channel-${first.id}`);
      } else {
        setView("channel");
        setActiveChannelId(null);
      }
    },
    [token, openHome, socket, loadChatPins],
  );

  const openChannel = useCallback(
    async (channelId: string) => {
      if (!token) return;
      if (activeChannelId) socket?.emit("channel:leave", activeChannelId);
      setActiveChannelId(channelId);
      setView("channel");
      socket?.emit("channel:join", channelId);
      const msgs = await api.fetchChannelMessages(token, channelId);
      setChannelMessages((prev) => ({ ...prev, [channelId]: msgs }));
      await loadChatPins(`channel-${channelId}`);
    },
    [token, activeChannelId, socket, loadChatPins],
  );

  const sendDm = useCallback(
    (recipientId: string, content: string, replyToId?: string) => {
      if (!socket || !content.trim()) return;
      socket.emit("dm:send", { recipientId, content: content.trim(), replyToId });
    },
    [socket],
  );

  const sendGroupDm = useCallback(
    (groupId: string, content: string, replyToId?: string) => {
      if (!socket || !content.trim()) return;
      socket.emit("group-dm:send", { groupId, content: content.trim(), replyToId });
    },
    [socket],
  );

  const createGroupDmAction = useCallback(
    async (memberIds: string[], name?: string) => {
      if (!token) throw new Error("Oturum gerekli");
      const group = await api.createGroupDm(token, memberIds, name);
      setGroupDms((prev) => [group, ...prev.filter((g) => g.id !== group.id)]);
      return group;
    },
    [token],
  );

  const acceptMessageRequestAction = useCallback(
    async (requestId: string) => {
      if (!token) return;
      const { partnerId, message } = await api.acceptMessageRequest(token, requestId);
      setDmMessages((prev) => ({
        ...prev,
        [partnerId]: [...(prev[partnerId] ?? []), message],
      }));
      await refreshMessageRequests();
      await refreshFriends();
      openDm(partnerId);
    },
    [token, refreshMessageRequests, refreshFriends, openDm],
  );

  const declineMessageRequestAction = useCallback(
    async (requestId: string) => {
      if (!token) return;
      await api.declineMessageRequest(token, requestId);
      await refreshMessageRequests();
    },
    [token, refreshMessageRequests],
  );

  const sendChannelMessage = useCallback(
    (channelId: string, content: string, replyToId?: string) => {
      if (!socket || !content.trim()) return;
      socket.emit("channel:send", { channelId, content: content.trim(), replyToId });
    },
    [socket],
  );

  const pinMessage = useCallback(
    async (chatId: string, messageId: string) => {
      if (!token) return;
      const { pinnedIds } = await api.pinChatMessage(token, chatId, messageId);
      setChatPins((prev) => ({ ...prev, [chatId]: pinnedIds }));
    },
    [token],
  );

  const unpinMessage = useCallback(
    async (chatId: string, messageId: string) => {
      if (!token) return;
      const { pinnedIds } = await api.unpinChatMessage(token, chatId, messageId);
      setChatPins((prev) => ({ ...prev, [chatId]: pinnedIds }));
    },
    [token],
  );

  const toggleReaction = useCallback(
    (chatId: string, messageId: string, emoji: string) => {
      if (socket) {
        socket.emit("message:react", { chatId, messageId, emoji });
        return;
      }
      if (!token) return;
      api.toggleMessageReaction(token, chatId, messageId, emoji).catch(() => undefined);
    },
    [socket, token],
  );

  const forwardMessage = useCallback(
    (content: string, dest: ForwardDestination) => {
      if (!content.trim()) return;
      switch (dest.type) {
        case "dm":
          sendDm(dest.id, content);
          break;
        case "group":
          sendGroupDm(dest.id, content);
          break;
        case "channel":
          sendChannelMessage(dest.id, content);
          break;
      }
    },
    [sendDm, sendGroupDm, sendChannelMessage],
  );

  const sendFriendRequest = useCallback(
    async (username: string) => {
      if (!token) return;
      await api.sendFriendRequest(token, username);
      await refreshFriends();
    },
    [token, refreshFriends],
  );

  const acceptFriend = useCallback(
    async (userId: string) => {
      if (!token) return;
      await api.acceptFriend(token, userId);
      await refreshFriends();
    },
    [token, refreshFriends],
  );

  const declineFriend = useCallback(
    async (userId: string) => {
      if (!token) return;
      await api.declineFriend(token, userId);
      await refreshFriends();
    },
    [token, refreshFriends],
  );

  const cancelFriendRequest = useCallback(
    async (userId: string) => {
      if (!token) return;
      await api.cancelFriendRequest(token, userId);
      await refreshFriends();
    },
    [token, refreshFriends],
  );

  const blockUserAction = useCallback(
    async (userId: string) => {
      if (!token) return;
      await api.blockUser(token, userId);
      await refreshFriends();
    },
    [token, refreshFriends],
  );

  const unblockUserAction = useCallback(
    async (userId: string) => {
      if (!token) return;
      await api.unblockUser(token, userId);
      await refreshFriends();
    },
    [token, refreshFriends],
  );

  const removeFriendAction = useCallback(
    async (friendId: string) => {
      if (!token) return;
      await api.removeFriend(token, friendId);
      await refreshFriends();
    },
    [token, refreshFriends],
  );

  const createServerAction = useCallback(
    async (name: string) => {
      if (!token) throw new Error("Oturum gerekli");
      const server = await api.createServer(token, name);
      setServers((prev) => [...prev, server]);
      return server;
    },
    [token],
  );

  const joinServerAction = useCallback(
    async (inviteCode: string) => {
      if (!token) throw new Error("Oturum gerekli");
      const server = await api.joinServer(token, inviteCode);
      setServers((prev) => (prev.some((s) => s.id === server.id) ? prev : [...prev, server]));
      return server;
    },
    [token],
  );

  const leaveServerAction = useCallback(
    async (serverId: string) => {
      if (!token) throw new Error("Oturum gerekli");
      await api.leaveServer(token, serverId);
      setServers((prev) => prev.filter((s) => s.id !== serverId));
      if (activeServerId === serverId) openHome();
    },
    [token, activeServerId, openHome],
  );

  const createChannelAction = useCallback(
    async (name: string) => {
      if (!token || activeServerId === "home") return;
      const channel = await api.createChannel(token, activeServerId, name);
      setChannels((prev) => [...prev, channel]);
      await openChannel(channel.id);
    },
    [token, activeServerId, openChannel],
  );

  const updateProfile = useCallback(
    async (data: {
      statusText?: string;
      status?: Status;
      name?: string;
      avatar?: string;
      banner?: string;
      bio?: string;
      accentColor?: string;
    }) => {
      if (!token) return;
      const user = await api.updateProfile(token, data);
      setCurrentUser(user);
      if (data.status) socket?.emit("presence:set", { status: data.status });
    },
    [token, socket],
  );

  const uploadProfileImage = useCallback(
    async (kind: "avatar" | "banner", dataUrl: string) => {
      if (!token) throw new Error("Oturum gerekli");
      const user = await api.uploadProfileImage(token, kind, dataUrl);
      setCurrentUser(user);
      return user;
    },
    [token],
  );

  const updateSettings = useCallback(
    async (settings: Partial<UserSettings>) => {
      if (!token) return;
      const user = await api.updateSettings(token, settings);
      setCurrentUser(user);
      if (settings.theme) applyTheme(settings.theme);
    },
    [token],
  );

  const changePassword = useCallback(
    async (currentPassword: string, newPassword: string) => {
      if (!token) return;
      await api.changePassword(token, currentPassword, newPassword);
    },
    [token],
  );

  const deleteAccountAction = useCallback(
    async (password: string) => {
      if (!token) return;
      await api.deleteAccount(token, password);
      await logout();
    },
    [token, logout],
  );

  const updateServerSettingsAction = useCallback(
    async (data: { name?: string; icon?: string; banner?: string; description?: string }) => {
      if (!token || activeServerId === "home") throw new Error("Sunucu seçili değil");
      const server = await api.updateServer(token, activeServerId, data);
      setServers((prev) => prev.map((s) => (s.id === server.id ? server : s)));
      return server;
    },
    [token, activeServerId],
  );

  const uploadServerImage = useCallback(
    async (kind: "icon" | "banner", dataUrl: string) => {
      if (!token || activeServerId === "home") throw new Error("Sunucu seçili değil");
      const server = await api.uploadServerImage(token, activeServerId, kind, dataUrl);
      setServers((prev) => prev.map((s) => (s.id === server.id ? server : s)));
      return server;
    },
    [token, activeServerId],
  );

  const regenerateServerInviteAction = useCallback(async () => {
    if (!token || activeServerId === "home") throw new Error("Sunucu seçili değil");
    const server = await api.regenerateServerInvite(token, activeServerId);
    setServers((prev) => prev.map((s) => (s.id === server.id ? server : s)));
    return server;
  }, [token, activeServerId]);

  const searchUsersAction = useCallback(
    async (q: string) => {
      if (!token) return [];
      return api.searchUsers(token, q);
    },
    [token],
  );

  const value = useMemo<AppState>(
    () => ({
      token,
      currentUser,
      friends,
      pending,
      blocked,
      dmPartners,
      groupDms,
      messageRequests,
      servers,
      channels,
      serverMembers,
      dmMessages,
      groupDmMessages,
      channelMessages,
      chatPins,
      view,
      friendsTab,
      activeDmId,
      activeGroupDmId,
      activeServerId,
      activeChannelId,
      activeModal,
      settingsTab,
      loading,
      register,
      login,
      logout,
      refreshFriends,
      setView,
      setFriendsTab,
      setActiveModal,
      openHome,
      openFriends,
      openMessageRequests,
      openDm,
      openGroupDm,
      openServer,
      openChannel,
      sendDm,
      sendGroupDm,
      sendChannelMessage,
      loadChatPins,
      pinMessage,
      unpinMessage,
      toggleReaction,
      forwardMessage,
      createGroupDm: createGroupDmAction,
      acceptMessageRequest: acceptMessageRequestAction,
      declineMessageRequest: declineMessageRequestAction,
      refreshMessageRequests,
      sendFriendRequest,
      acceptFriend,
      declineFriend,
      cancelFriendRequest,
      blockUser: blockUserAction,
      unblockUser: unblockUserAction,
      removeFriend: removeFriendAction,
      createServer: createServerAction,
      joinServer: joinServerAction,
      leaveServer: leaveServerAction,
      createChannel: createChannelAction,
      updateProfile,
      uploadProfileImage,
      updateSettings,
      changePassword,
      deleteAccount: deleteAccountAction,
      updateServerSettings: updateServerSettingsAction,
      uploadServerImage,
      regenerateServerInvite: regenerateServerInviteAction,
      searchUsers: searchUsersAction,
    }),
    [
      token,
      currentUser,
      friends,
      pending,
      blocked,
      dmPartners,
      groupDms,
      messageRequests,
      servers,
      channels,
      serverMembers,
      dmMessages,
      groupDmMessages,
      channelMessages,
      chatPins,
      view,
      friendsTab,
      activeDmId,
      activeGroupDmId,
      activeServerId,
      activeChannelId,
      activeModal,
      settingsTab,
      loading,
      register,
      login,
      logout,
      refreshFriends,
      setActiveModal,
      openHome,
      openFriends,
      openMessageRequests,
      openDm,
      openGroupDm,
      openServer,
      openChannel,
      sendDm,
      sendGroupDm,
      sendChannelMessage,
      loadChatPins,
      pinMessage,
      unpinMessage,
      toggleReaction,
      forwardMessage,
      createGroupDmAction,
      acceptMessageRequestAction,
      declineMessageRequestAction,
      refreshMessageRequests,
      sendFriendRequest,
      acceptFriend,
      declineFriend,
      cancelFriendRequest,
      blockUserAction,
      unblockUserAction,
      removeFriendAction,
      createServerAction,
      joinServerAction,
      leaveServerAction,
      createChannelAction,
      updateProfile,
      uploadProfileImage,
      updateSettings,
      changePassword,
      deleteAccountAction,
      updateServerSettingsAction,
      uploadServerImage,
      regenerateServerInviteAction,
      searchUsersAction,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
