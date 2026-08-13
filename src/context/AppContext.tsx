import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { io, type Socket } from "socket.io-client";
import * as api from "../api/client";
import type {
  Channel,
  FriendRequest,
  FriendsTab,
  Message,
  ModalType,
  Server,
  Status,
  User,
  View,
} from "../types";

interface AppState {
  token: string | null;
  currentUser: User | null;
  friends: User[];
  pending: FriendRequest[];
  blocked: User[];
  dmPartners: User[];
  servers: Server[];
  channels: Channel[];
  serverMembers: User[];
  dmMessages: Record<string, Message[]>;
  channelMessages: Record<string, Message[]>;
  view: View;
  friendsTab: FriendsTab;
  activeDmId: string | null;
  activeServerId: string;
  activeChannelId: string | null;
  activeModal: ModalType;
  loading: boolean;
  register: (data: {
    email: string;
    username: string;
    password: string;
    displayName: string;
  }) => Promise<void>;
  login: (login: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshFriends: () => Promise<void>;
  setView: (view: View) => void;
  setFriendsTab: (tab: FriendsTab) => void;
  setActiveModal: (modal: ModalType) => void;
  openHome: () => void;
  openDm: (userId: string) => void;
  openServer: (serverId: string) => Promise<void>;
  openChannel: (channelId: string) => Promise<void>;
  sendDm: (recipientId: string, content: string) => void;
  sendChannelMessage: (channelId: string, content: string) => void;
  sendFriendRequest: (username: string) => Promise<void>;
  acceptFriend: (userId: string) => Promise<void>;
  declineFriend: (userId: string) => Promise<void>;
  cancelFriendRequest: (userId: string) => Promise<void>;
  blockUser: (userId: string) => Promise<void>;
  unblockUser: (userId: string) => Promise<void>;
  removeFriend: (friendId: string) => Promise<void>;
  createServer: (name: string) => Promise<Server>;
  joinServer: (inviteCode: string) => Promise<Server>;
  createChannel: (name: string) => Promise<void>;
  updateProfile: (data: { statusText?: string; status?: Status; name?: string }) => Promise<void>;
  searchUsers: (q: string) => Promise<User[]>;
}

const AppContext = createContext<AppState | null>(null);
const TOKEN_KEY = "hiqu_token";

export function AppProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [friends, setFriends] = useState<User[]>([]);
  const [pending, setPending] = useState<FriendRequest[]>([]);
  const [blocked, setBlocked] = useState<User[]>([]);
  const [dmPartners, setDmPartners] = useState<User[]>([]);
  const [servers, setServers] = useState<Server[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [serverMembers, setServerMembers] = useState<User[]>([]);
  const [dmMessages, setDmMessages] = useState<Record<string, Message[]>>({});
  const [channelMessages, setChannelMessages] = useState<Record<string, Message[]>>({});
  const [view, setView] = useState<View>("friends");
  const [friendsTab, setFriendsTab] = useState<FriendsTab>("online");
  const [activeDmId, setActiveDmId] = useState<string | null>(null);
  const [activeServerId, setActiveServerId] = useState("home");
  const [activeChannelId, setActiveChannelId] = useState<string | null>(null);
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState<Socket | null>(null);

  const refreshFriends = useCallback(async () => {
    if (!token) return;
    const [f, p, b, dms] = await Promise.all([
      api.fetchFriends(token),
      api.fetchPending(token),
      api.fetchBlocked(token),
      api.fetchDmPartners(token),
    ]);
    setFriends(f);
    setPending(p);
    setBlocked(b);
    setDmPartners(dms);
  }, [token]);

  const loadInitial = useCallback(
    async (authToken: string) => {
      const [me, userServers] = await Promise.all([
        api.fetchMe(authToken),
        api.fetchServers(authToken),
      ]);
      setCurrentUser(me);
      setServers(userServers);
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
          const patch = (list: User[]) => list.map((u) => (u.id === user.id ? user : u));
          setFriends(patch);
          setDmPartners(patch);
          setServerMembers(patch);
          setCurrentUser((me) => (me?.id === user.id ? user : me));
        });

        s.on("friend:request", () => refreshFriends());
        s.on("friend:accepted", () => refreshFriends());
      } catch {
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token, loadInitial, refreshFriends]);

  useEffect(() => {
    return () => {
      socket?.disconnect();
    };
  }, [socket]);

  const authSuccess = useCallback((newToken: string, user: User) => {
    localStorage.setItem(TOKEN_KEY, newToken);
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
      authSuccess(newToken, user);
    },
    [authSuccess],
  );

  const login = useCallback(
    async (loginValue: string, password: string) => {
      const { token: newToken, user } = await api.login(loginValue, password);
      authSuccess(newToken, user);
    },
    [authSuccess],
  );

  const logout = useCallback(async () => {
    if (token) await api.logout(token).catch(() => undefined);
    socket?.disconnect();
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setCurrentUser(null);
    setFriends([]);
    setPending([]);
    setBlocked([]);
    setDmPartners([]);
    setServers([]);
    setChannels([]);
    setDmMessages({});
    setChannelMessages({});
    setSocket(null);
    setActiveServerId("home");
    setView("friends");
  }, [socket, token]);

  const openHome = useCallback(() => {
    setActiveServerId("home");
    setActiveChannelId(null);
    setView("friends");
    setActiveDmId(null);
  }, []);

  const openDm = useCallback(
    async (userId: string) => {
      if (!token) return;
      setActiveServerId("home");
      setActiveChannelId(null);
      setActiveDmId(userId);
      setView("dm");
      const msgs = await api.fetchDmMessages(token, userId);
      setDmMessages((prev) => ({ ...prev, [userId]: msgs }));
    },
    [token],
  );

  const openServer = useCallback(
    async (serverId: string) => {
      if (!token || serverId === "home") {
        openHome();
        return;
      }
      setActiveServerId(serverId);
      setActiveDmId(null);
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
      } else {
        setView("channel");
        setActiveChannelId(null);
      }
    },
    [token, openHome, socket],
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
    },
    [token, activeChannelId, socket],
  );

  const sendDm = useCallback(
    (recipientId: string, content: string) => {
      if (!socket || !content.trim()) return;
      socket.emit("dm:send", { recipientId, content: content.trim() });
    },
    [socket],
  );

  const sendChannelMessage = useCallback(
    (channelId: string, content: string) => {
      if (!socket || !content.trim()) return;
      socket.emit("channel:send", { channelId, content: content.trim() });
    },
    [socket],
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
    async (data: { statusText?: string; status?: Status; name?: string }) => {
      if (!token) return;
      const user = await api.updateProfile(token, data);
      setCurrentUser(user);
      if (data.status) socket?.emit("presence:set", { status: data.status });
    },
    [token, socket],
  );

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
      servers,
      channels,
      serverMembers,
      dmMessages,
      channelMessages,
      view,
      friendsTab,
      activeDmId,
      activeServerId,
      activeChannelId,
      activeModal,
      loading,
      register,
      login,
      logout,
      refreshFriends,
      setView,
      setFriendsTab,
      setActiveModal,
      openHome,
      openDm,
      openServer,
      openChannel,
      sendDm,
      sendChannelMessage,
      sendFriendRequest,
      acceptFriend,
      declineFriend,
      cancelFriendRequest,
      blockUser: blockUserAction,
      unblockUser: unblockUserAction,
      removeFriend: removeFriendAction,
      createServer: createServerAction,
      joinServer: joinServerAction,
      createChannel: createChannelAction,
      updateProfile,
      searchUsers: searchUsersAction,
    }),
    [
      token,
      currentUser,
      friends,
      pending,
      blocked,
      dmPartners,
      servers,
      channels,
      serverMembers,
      dmMessages,
      channelMessages,
      view,
      friendsTab,
      activeDmId,
      activeServerId,
      activeChannelId,
      activeModal,
      loading,
      register,
      login,
      logout,
      refreshFriends,
      openHome,
      openDm,
      openServer,
      openChannel,
      sendDm,
      sendChannelMessage,
      sendFriendRequest,
      acceptFriend,
      declineFriend,
      cancelFriendRequest,
      blockUserAction,
      unblockUserAction,
      removeFriendAction,
      createServerAction,
      joinServerAction,
      createChannelAction,
      updateProfile,
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
