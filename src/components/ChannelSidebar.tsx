import { Hash, Plus, Search, Settings, Users } from "lucide-react";
import type { Channel, Server, User } from "../types";
import { Avatar } from "./Avatar";
import { UserPanel } from "./UserPanel";

interface HomeSidebarProps {
  currentUser: User;
  friends: User[];
  dmPartners: User[];
  activeDmId: string | null;
  friendsActive: boolean;
  onFriendsClick: () => void;
  onSelectDm: (userId: string) => void;
  onNewDm: () => void;
  onSettings: () => void;
  onLogout: () => void;
}

export function HomeSidebar({
  currentUser,
  friends,
  dmPartners,
  activeDmId,
  friendsActive,
  onFriendsClick,
  onSelectDm,
  onNewDm,
  onSettings,
  onLogout,
}: HomeSidebarProps) {
  const dmList = friends.length > 0 ? friends : dmPartners;

  return (
    <aside className="flex w-60 shrink-0 flex-col bg-hiqu-panel">
      <div className="p-2">
        <div className="flex items-center gap-2 rounded-md bg-hiqu-bg/60 px-2 py-1.5">
          <Search className="size-4 shrink-0 text-hiqu-muted" />
          <input
            type="text"
            placeholder="Sohbet bul veya başlat"
            className="w-full bg-transparent text-sm placeholder:text-hiqu-muted outline-none"
          />
        </div>
      </div>

      <nav className="px-2">
        <button
          onClick={onFriendsClick}
          className={`mb-0.5 flex w-full items-center gap-3 rounded-md px-2 py-1.5 text-sm transition-colors ${
            friendsActive ? "bg-hiqu-hover text-hiqu-text" : "text-hiqu-muted hover:bg-hiqu-hover hover:text-hiqu-text"
          }`}
        >
          <Users className="size-5" />
          Arkadaşlar
        </button>
      </nav>

      <div className="mt-4 flex items-center justify-between px-4">
        <span className="text-xs font-semibold uppercase tracking-wide text-hiqu-muted">
          Direkt Mesajlar
        </span>
        <button
          onClick={onNewDm}
          title="Yeni mesaj"
          className="text-hiqu-muted transition-colors hover:text-hiqu-text"
        >
          <Plus className="size-4" />
        </button>
      </div>

      <div className="mt-1 flex-1 overflow-y-auto px-2">
        {dmList.length === 0 ? (
          <p className="px-2 py-4 text-center text-xs text-hiqu-muted">
            Arkadaş ekleyerek mesajlaşmaya başla.
          </p>
        ) : (
          dmList.map((user) => (
            <button
              key={user.id}
              onClick={() => onSelectDm(user.id)}
              className={`mb-0.5 flex w-full items-center gap-3 rounded-md px-2 py-1.5 transition-colors ${
                activeDmId === user.id && !friendsActive
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
          ))
        )}
      </div>

      <UserPanel user={currentUser} onSettings={onSettings} onLogout={onLogout} />
    </aside>
  );
}

interface ServerSidebarPanelProps {
  server: Server;
  channels: Channel[];
  activeChannelId: string | null;
  currentUser: User;
  isOwner: boolean;
  onSelectChannel: (id: string) => void;
  onCreateChannel: () => void;
  onSettings: () => void;
  onLogout: () => void;
}

export function ServerSidebarPanel({
  server,
  channels,
  activeChannelId,
  currentUser,
  isOwner,
  onSelectChannel,
  onCreateChannel,
  onSettings,
  onLogout,
}: ServerSidebarPanelProps) {
  return (
    <aside className="flex w-60 shrink-0 flex-col bg-hiqu-panel">
      <header className="flex h-12 items-center justify-between border-b border-hiqu-border px-4 shadow-sm">
        <span className="truncate font-semibold">{server.name}</span>
        <button onClick={onSettings} className="text-hiqu-muted hover:text-hiqu-text">
          <Settings className="size-4" />
        </button>
      </header>

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

      <UserPanel user={currentUser} onSettings={onSettings} onLogout={onLogout} />
    </aside>
  );
}
