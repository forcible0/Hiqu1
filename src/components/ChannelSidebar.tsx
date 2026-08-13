import { Hash, MessageSquare, Plus, Search, Settings, UserPlus, Users } from "lucide-react";
import { useMemo, useState } from "react";
import type { Channel, GroupDm, Server, User } from "../types";
import { Avatar } from "./Avatar";
import { ServerHeaderMenu } from "./ServerHeaderMenu";
import { UserPanel } from "./UserPanel";
import type { AccountUser, Status } from "../types";

interface HomeSidebarProps {
  currentUser: AccountUser;
  friends: User[];
  dmPartners: User[];
  groupDms: GroupDm[];
  messageRequestCount: number;
  activeDmId: string | null;
  activeGroupDmId: string | null;
  friendsActive: boolean;
  messageRequestsActive: boolean;
  onFriendsClick: () => void;
  onMessageRequestsClick: () => void;
  onSelectDm: (userId: string) => void;
  onSelectGroupDm: (groupId: string) => void;
  onNewDm: () => void;
  onNewGroupDm: () => void;
  onSettings: () => void;
  onEditProfile: () => void;
  onSetStatus: (status: Status) => void;
  onLogout: () => void;
}

export function HomeSidebar({
  currentUser,
  friends,
  dmPartners,
  groupDms,
  messageRequestCount,
  activeDmId,
  activeGroupDmId,
  friendsActive,
  messageRequestsActive,
  onFriendsClick,
  onMessageRequestsClick,
  onSelectDm,
  onSelectGroupDm,
  onNewDm,
  onNewGroupDm,
  onSettings,
  onEditProfile,
  onSetStatus,
  onLogout,
}: HomeSidebarProps) {
  const [search, setSearch] = useState("");
  const dmList = friends.length > 0 ? friends : dmPartners;

  const filteredDms = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return dmList;
    return dmList.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q) ||
        (u.statusText?.toLowerCase().includes(q) ?? false),
    );
  }, [dmList, search]);

  const filteredGroups = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return groupDms;
    return groupDms.filter((g) => g.name.toLowerCase().includes(q));
  }, [groupDms, search]);

  const hasItems = dmList.length > 0 || groupDms.length > 0;

  return (
    <aside className="hiqu-sidebar flex w-60 shrink-0 flex-col">
      <div className="p-2">
        <div className="hiqu-search flex items-center gap-2 rounded-md px-2 py-1.5">
          <Search className="size-4 shrink-0 text-hiqu-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Sohbet bul veya başlat"
            className="w-full bg-transparent text-sm placeholder:text-hiqu-muted outline-none"
          />
        </div>
      </div>

      <nav className="space-y-0.5 px-2">
        <button
          onClick={onFriendsClick}
          className={`flex w-full items-center gap-3 rounded-md px-2 py-1.5 text-sm transition-colors ${
            friendsActive ? "bg-hiqu-hover text-hiqu-text" : "text-hiqu-muted hover:bg-hiqu-hover hover:text-hiqu-text"
          }`}
        >
          <Users className="size-5" />
          Arkadaşlar
        </button>
        <button
          onClick={onMessageRequestsClick}
          className={`flex w-full items-center gap-3 rounded-md px-2 py-1.5 text-sm transition-colors ${
            messageRequestsActive
              ? "bg-hiqu-hover text-hiqu-text"
              : "text-hiqu-muted hover:bg-hiqu-hover hover:text-hiqu-text"
          }`}
        >
          <MessageSquare className="size-5" />
          <span className="flex-1 text-left">Mesaj İstekleri</span>
          {messageRequestCount > 0 && (
            <span className="rounded-full bg-hiqu-dnd px-1.5 text-xs text-white">
              {messageRequestCount}
            </span>
          )}
        </button>
      </nav>

      <div className="mt-4 flex items-center justify-between px-4">
        <span className="text-xs font-semibold uppercase tracking-wide text-hiqu-muted">
          Direkt Mesajlar
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={onNewGroupDm}
            title="Yeni Grup DM"
            className="text-hiqu-muted transition-colors hover:text-hiqu-text"
          >
            <UserPlus className="size-4" />
          </button>
          <button
            onClick={onNewDm}
            title="Yeni mesaj"
            className="text-hiqu-muted transition-colors hover:text-hiqu-text"
          >
            <Plus className="size-4" />
          </button>
        </div>
      </div>

      <div className="mt-1 flex-1 overflow-y-auto px-2">
        {!hasItems ? (
          <p className="px-2 py-4 text-center text-xs text-hiqu-muted">
            Arkadaş ekleyerek mesajlaşmaya başla.
          </p>
        ) : filteredGroups.length === 0 && filteredDms.length === 0 ? (
          <p className="px-2 py-4 text-center text-xs text-hiqu-muted">
            &quot;{search}&quot; için sonuç yok.
          </p>
        ) : (
          <>
            {filteredGroups.map((group) => (
              <button
                key={group.id}
                onClick={() => onSelectGroupDm(group.id)}
                className={`mb-0.5 flex w-full items-center gap-3 rounded-md px-2 py-1.5 transition-colors ${
                  activeGroupDmId === group.id && !friendsActive && !messageRequestsActive
                    ? "bg-hiqu-hover"
                    : "hover:bg-hiqu-hover/60"
                }`}
              >
                <img src={group.icon} alt="" className="size-8 rounded-full object-cover bg-hiqu-elevated" />
                <div className="min-w-0 flex-1 text-left">
                  <p className="truncate text-sm font-medium">{group.name}</p>
                  <p className="truncate text-xs text-hiqu-muted">{group.members.length} üye</p>
                </div>
              </button>
            ))}
            {filteredDms.map((user) => (
              <button
                key={user.id}
                onClick={() => onSelectDm(user.id)}
                className={`mb-0.5 flex w-full items-center gap-3 rounded-md px-2 py-1.5 transition-colors ${
                  activeDmId === user.id && !friendsActive && !messageRequestsActive
                    ? "bg-hiqu-hover"
                    : "hover:bg-hiqu-hover/60"
                }`}
              >
                <Avatar src={user.avatar} alt={user.name} size="sm" status={user.status} />
                <div className="min-w-0 flex-1 text-left">
                  <p className="truncate text-sm font-medium">{user.name}</p>
                  <p className="truncate text-xs text-hiqu-muted">{user.statusText || `@${user.username}`}</p>
                </div>
              </button>
            ))}
          </>
        )}
      </div>

      <UserPanel
        user={currentUser}
        onSettings={onSettings}
        onLogout={onLogout}
        onEditProfile={onEditProfile}
        onSetStatus={onSetStatus}
      />
    </aside>
  );
}

interface ServerSidebarPanelProps {
  server: Server;
  channels: Channel[];
  activeChannelId: string | null;
  currentUser: AccountUser;
  isOwner: boolean;
  onSelectChannel: (id: string) => void;
  onCreateChannel: () => void;
  onServerSettings: () => void;
  onUserSettings: () => void;
  onEditProfile: () => void;
  onSetStatus: (status: Status) => void;
  onLogout: () => void;
  onLeaveServer: () => Promise<void>;
}

export function ServerSidebarPanel({
  server,
  channels,
  activeChannelId,
  currentUser,
  isOwner,
  onSelectChannel,
  onCreateChannel,
  onServerSettings,
  onUserSettings,
  onEditProfile,
  onSetStatus,
  onLogout,
  onLeaveServer,
}: ServerSidebarPanelProps) {
  return (
    <aside className="hiqu-sidebar flex w-60 shrink-0 flex-col">
      <div className="relative shrink-0">
        {server.banner ? (
          <>
            <div
              className="h-[132px] w-full bg-cover bg-center"
              style={{ backgroundImage: `url(${server.banner})` }}
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/15 via-transparent to-black/70" />
          </>
        ) : null}
        <div
          className={`flex h-12 shrink-0 items-center justify-between px-4 ${
            server.banner
              ? "absolute inset-x-0 bottom-0"
              : "border-b border-hiqu-border/60 shadow-sm"
          }`}
        >
          <ServerHeaderMenu
            server={server}
            userId={currentUser.id}
            isOwner={isOwner}
            bannerMode={!!server.banner}
            onLeaveServer={onLeaveServer}
          />
          {isOwner && (
            <button
              onClick={onServerSettings}
              className={`shrink-0 rounded p-1 transition-colors ${
                server.banner
                  ? "text-white/90 hover:bg-black/25 hover:text-white"
                  : "text-hiqu-muted hover:text-hiqu-text"
              }`}
              title="Sunucu Ayarları"
            >
              <Settings className="size-4" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        <div className="mb-1 flex items-center justify-between px-2">
          <span className="text-xs font-semibold uppercase text-hiqu-muted">Metin Kanalları</span>
          {isOwner && (
            <button onClick={onCreateChannel} className="text-hiqu-muted hover:text-hiqu-text">
              <Plus className="size-3.5" />
            </button>
          )}
        </div>
        {channels.map((ch) => (
          <button
            key={ch.id}
            onClick={() => onSelectChannel(ch.id)}
            className={`mb-0.5 flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm ${
              activeChannelId === ch.id
                ? "bg-hiqu-hover text-hiqu-text"
                : "text-hiqu-muted hover:bg-hiqu-hover/60 hover:text-hiqu-text"
            }`}
          >
            <Hash className="size-4 shrink-0" />
            {ch.name}
          </button>
        ))}
        {channels.length === 0 && (
          <p className="px-2 py-2 text-xs text-hiqu-muted">Kanal yok.</p>
        )}
      </div>

      <UserPanel
        user={currentUser}
        onSettings={onUserSettings}
        onLogout={onLogout}
        onEditProfile={onEditProfile}
        onSetStatus={onSetStatus}
      />
    </aside>
  );
}
