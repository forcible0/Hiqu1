import { MessageSquare, UserPlus, X } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import type { Server, User } from "../types";
import { Avatar } from "./Avatar";

type Tab = "friends" | "servers";

interface FullProfileModalProps {
  user: User;
  mutualServers: Server[];
  mutualFriends: User[];
  friendsSince?: string;
  isFriend: boolean;
  loading?: boolean;
  onClose: () => void;
  onMessage: () => void;
  onAddFriend?: () => void;
  onOpenServer?: (serverId: string) => void;
  onOpenDm?: (userId: string) => void;
}

function noteKey(userId: string) {
  return `hiqu-profile-note-${userId}`;
}

export function FullProfileModal({
  user,
  mutualServers,
  mutualFriends,
  friendsSince,
  isFriend,
  loading,
  onClose,
  onMessage,
  onAddFriend,
  onOpenServer,
  onOpenDm,
}: FullProfileModalProps) {
  const [tab, setTab] = useState<Tab>("friends");
  const [note, setNote] = useState("");
  const [editingNote, setEditingNote] = useState(false);

  useEffect(() => {
    setNote(localStorage.getItem(noteKey(user.id)) ?? "");
    setTab("friends");
    setEditingNote(false);
  }, [user.id]);

  const saveNote = (value: string) => {
    setNote(value);
    if (value.trim()) localStorage.setItem(noteKey(user.id), value.trim());
    else localStorage.removeItem(noteKey(user.id));
    setEditingNote(false);
  };

  const bannerStyle = user.banner
    ? { backgroundImage: `url(${user.banner})` }
    : user.accentColor
      ? { backgroundColor: user.accentColor }
      : undefined;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        className="flex h-[min(560px,90vh)] w-full max-w-4xl overflow-hidden rounded-xl bg-hiqu-panel shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <aside className="flex w-72 shrink-0 flex-col border-r border-hiqu-border/60 bg-hiqu-surface">
          <div
            className="relative h-28 bg-hiqu-banner bg-cover bg-center"
            style={bannerStyle}
          />
          <div className="relative flex flex-1 flex-col px-4 pb-4">
            <div className="absolute -top-10 left-4">
              <Avatar
                src={user.avatar}
                alt={user.name}
                size="xl"
                status={user.status}
                statusBorderClass="border-hiqu-surface"
                className="[&_img]:border-[5px] [&_img]:border-hiqu-surface"
              />
            </div>

            <div className="pt-12">
              <h2 className="text-xl font-bold leading-tight">{user.name}</h2>
              <p className="text-sm text-hiqu-muted">@{user.username}</p>
            </div>

            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  onMessage();
                  onClose();
                }}
                className="flex flex-1 items-center justify-center gap-2 rounded-md bg-hiqu-accent py-2 text-sm font-medium text-white hover:bg-hiqu-accent-hover"
              >
                <MessageSquare className="size-4" />
                Mesaj
              </button>
              {!isFriend && onAddFriend && (
                <button
                  type="button"
                  onClick={onAddFriend}
                  title="Arkadaş ekle"
                  className="flex size-9 items-center justify-center rounded-md bg-hiqu-elevated text-hiqu-muted hover:bg-hiqu-hover hover:text-hiqu-text"
                >
                  <UserPlus className="size-4" />
                </button>
              )}
            </div>

            {(user.statusText || user.bio) && (
              <p className="mt-4 text-sm leading-relaxed text-hiqu-text">
                {user.statusText || user.bio}
              </p>
            )}

            <div className="mt-5 space-y-3 text-sm">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-hiqu-muted">
                  Üyelik Tarihi
                </p>
                <p className="mt-0.5">{user.memberSince}</p>
              </div>
              {friendsSince && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-hiqu-muted">
                    Arkadaş Olma
                  </p>
                  <p className="mt-0.5">{friendsSince}</p>
                </div>
              )}
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-hiqu-muted">
                  Not (sadece sana görünür)
                </p>
                {editingNote ? (
                  <textarea
                    autoFocus
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    onBlur={() => saveNote(note)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        saveNote(note);
                      }
                    }}
                    rows={2}
                    placeholder="Not ekle..."
                    className="mt-1 w-full rounded-md border border-hiqu-border/60 bg-hiqu-bg px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-hiqu-accent"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => setEditingNote(true)}
                    className="mt-1 block w-full rounded-md px-1 py-1 text-left text-sm text-hiqu-muted hover:bg-hiqu-hover hover:text-hiqu-text"
                  >
                    {note || "Not eklemek için tıkla"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex shrink-0 items-center justify-between border-b border-hiqu-border/60 px-4">
            <div className="flex gap-6">
              <TabBtn active={tab === "friends"} onClick={() => setTab("friends")}>
                Ortak Arkadaşlar
                {mutualFriends.length > 0 && (
                  <span className="ml-1 text-hiqu-muted">{mutualFriends.length}</span>
                )}
              </TabBtn>
              <TabBtn active={tab === "servers"} onClick={() => setTab("servers")}>
                Ortak Sunucular
                {mutualServers.length > 0 && (
                  <span className="ml-1 text-hiqu-muted">{mutualServers.length}</span>
                )}
              </TabBtn>
            </div>
            <button
              onClick={onClose}
              className="my-2 rounded p-1.5 text-hiqu-muted hover:bg-hiqu-hover hover:text-hiqu-text"
            >
              <X className="size-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5">
            {loading ? (
              <p className="text-center text-sm text-hiqu-muted">Yükleniyor...</p>
            ) : tab === "friends" ? (
              <FriendsTab friends={mutualFriends} onOpenDm={onOpenDm} onClose={onClose} />
            ) : (
              <ServersTab servers={mutualServers} onOpenServer={onOpenServer} onClose={onClose} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function TabBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative py-3 text-sm font-medium transition-colors ${
        active ? "text-hiqu-text" : "text-hiqu-muted hover:text-hiqu-text"
      }`}
    >
      {children}
      {active && <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-hiqu-text" />}
    </button>
  );
}

function FriendsTab({
  friends,
  onOpenDm,
  onClose,
}: {
  friends: User[];
  onOpenDm?: (userId: string) => void;
  onClose: () => void;
}) {
  if (friends.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center py-12 text-center text-hiqu-muted">
        <p className="font-medium text-hiqu-text">Ortak arkadaş yok</p>
        <p className="mt-1 max-w-xs text-sm">Bu kullanıcıyla ortak arkadaşınız bulunmuyor.</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {friends.map((friend) => (
        <button
          key={friend.id}
          type="button"
          onClick={() => {
            onOpenDm?.(friend.id);
            onClose();
          }}
          className="flex w-full items-center gap-3 rounded-lg bg-hiqu-elevated/60 p-3 text-left transition-colors hover:bg-hiqu-hover"
        >
          <Avatar src={friend.avatar} alt={friend.name} size="md" status={friend.status} />
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium">{friend.name}</p>
            <p className="truncate text-xs text-hiqu-muted">
              {friend.statusText || `@${friend.username}`}
            </p>
          </div>
        </button>
      ))}
    </div>
  );
}

function ServersTab({
  servers,
  onOpenServer,
  onClose,
}: {
  servers: Server[];
  onOpenServer?: (serverId: string) => void;
  onClose: () => void;
}) {
  if (servers.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center py-12 text-center text-hiqu-muted">
        <p className="font-medium text-hiqu-text">Ortak sunucu yok</p>
        <p className="mt-1 max-w-xs text-sm">Bu kullanıcıyla paylaştığın sunucu bulunmuyor.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {servers.map((server) => (
        <button
          key={server.id}
          type="button"
          onClick={() => {
            onOpenServer?.(server.id);
            onClose();
          }}
          className="flex items-center gap-3 rounded-lg bg-hiqu-elevated/60 p-3 text-left transition-colors hover:bg-hiqu-hover"
        >
          <img src={server.icon} alt="" className="size-12 rounded-2xl object-cover" />
          <div className="min-w-0">
            <p className="truncate font-medium">{server.name}</p>
            <p className="truncate text-xs text-hiqu-muted">Sunucuya git</p>
          </div>
        </button>
      ))}
    </div>
  );
}
