import {
  Ban,
  Check,
  MessageSquare,
  MoreHorizontal,
  Search,
  UserMinus,
  UserPlus,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import type { FriendRequest, FriendsTab, User } from "../types";
import { Avatar } from "./Avatar";

interface FriendsViewProps {
  tab: FriendsTab;
  onTabChange: (tab: FriendsTab) => void;
  friends: User[];
  pending: FriendRequest[];
  blocked: User[];
  onAddFriend: () => void;
  onMessage: (userId: string) => void;
  onAccept: (userId: string) => void;
  onDecline: (userId: string) => void;
  onCancel: (userId: string) => void;
  onBlock: (userId: string) => void;
  onUnblock: (userId: string) => void;
  onRemove: (userId: string) => void;
}

const tabs: { id: FriendsTab; label: string }[] = [
  { id: "online", label: "Çevrimiçi" },
  { id: "all", label: "Tümü" },
  { id: "pending", label: "Bekleyen" },
  { id: "blocked", label: "Engelli" },
];

export function FriendsView({
  tab,
  onTabChange,
  friends,
  pending,
  blocked,
  onAddFriend,
  onMessage,
  onAccept,
  onDecline,
  onCancel,
  onBlock,
  onUnblock,
  onRemove,
}: FriendsViewProps) {
  const [search, setSearch] = useState("");

  const onlineFriends = useMemo(
    () => friends.filter((f) => f.status === "online" || f.status === "idle"),
    [friends],
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    const list =
      tab === "online"
        ? onlineFriends
        : tab === "all"
          ? friends
          : tab === "blocked"
            ? blocked
            : [];
    if (!q) return list;
    return list.filter(
      (f) => f.name.toLowerCase().includes(q) || f.username.toLowerCase().includes(q),
    );
  }, [tab, friends, onlineFriends, blocked, search]);

  return (
    <div className="flex flex-1 flex-col bg-hiqu-bg">
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-hiqu-border px-4">
        <div className="flex items-center gap-4">
          <span className="font-semibold">Arkadaşlar</span>
          <div className="h-6 w-px bg-hiqu-border" />
          <div className="flex gap-1">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => onTabChange(t.id)}
                className={`rounded px-2 py-1 text-sm transition-colors ${
                  tab === t.id
                    ? "bg-hiqu-hover text-hiqu-text"
                    : "text-hiqu-muted hover:text-hiqu-text"
                }`}
              >
                {t.label}
                {t.id === "pending" && pending.length > 0 && (
                  <span className="ml-1 rounded-full bg-hiqu-dnd px-1.5 text-xs">{pending.length}</span>
                )}
              </button>
            ))}
          </div>
        </div>
        <button
          onClick={onAddFriend}
          className="flex items-center gap-2 rounded bg-hiqu-accent px-3 py-1.5 text-sm font-medium text-white hover:bg-hiqu-accent-hover"
        >
          <UserPlus className="size-4" />
          Arkadaş Ekle
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-4">
        {tab !== "pending" && (
          <>
            <div className="mb-4 flex items-center gap-2 rounded-md bg-hiqu-panel px-3 py-2">
              <Search className="size-4 text-hiqu-muted" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Ara"
                className="w-full bg-transparent text-sm outline-none placeholder:text-hiqu-muted"
              />
            </div>
            {filtered.length === 0 ? (
              <EmptyState tab={tab} onAddFriend={onAddFriend} />
            ) : (
              filtered.map((friend) => (
                <FriendRow
                  key={friend.id}
                  user={friend}
                  onMessage={() => onMessage(friend.id)}
                  onBlock={() => onBlock(friend.id)}
                  onRemove={() => onRemove(friend.id)}
                  onUnblock={() => onUnblock(friend.id)}
                  isBlocked={tab === "blocked"}
                />
              ))
            )}
          </>
        )}

        {tab === "pending" && (
          <div className="space-y-4">
            {pending.filter((p) => p.direction === "incoming").length > 0 && (
              <section>
                <h3 className="mb-2 text-xs font-semibold uppercase text-hiqu-muted">Gelen İstekler</h3>
                {pending
                  .filter((p) => p.direction === "incoming")
                  .map((p) => (
                    <PendingRow
                      key={p.id}
                      user={p}
                      onAccept={() => onAccept(p.id)}
                      onDecline={() => onDecline(p.id)}
                    />
                  ))}
              </section>
            )}
            {pending.filter((p) => p.direction === "outgoing").length > 0 && (
              <section>
                <h3 className="mb-2 text-xs font-semibold uppercase text-hiqu-muted">Giden İstekler</h3>
                {pending
                  .filter((p) => p.direction === "outgoing")
                  .map((p) => (
                    <div
                      key={p.id}
                      className="mb-1 flex items-center gap-3 rounded-md px-2 py-2 hover:bg-hiqu-panel/80"
                    >
                      <Avatar src={p.avatar} alt={p.name} size="md" />
                      <div className="flex-1">
                        <p className="font-medium">{p.name}</p>
                        <p className="text-sm text-hiqu-muted">Bekliyor...</p>
                      </div>
                      <button
                        onClick={() => onCancel(p.id)}
                        className="rounded-full bg-hiqu-elevated p-2 text-hiqu-muted hover:text-hiqu-dnd"
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                  ))}
              </section>
            )}
            {pending.length === 0 && (
              <p className="text-center text-hiqu-muted">Bekleyen istek yok.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function FriendRow({
  user,
  onMessage,
  onBlock,
  onRemove,
  onUnblock,
  isBlocked,
}: {
  user: User;
  onMessage: () => void;
  onBlock: () => void;
  onRemove: () => void;
  onUnblock: () => void;
  isBlocked: boolean;
}) {
  const [menu, setMenu] = useState(false);

  return (
    <div className="group relative mb-1 flex items-center gap-3 rounded-md px-2 py-2 hover:bg-hiqu-panel/80">
      <Avatar src={user.avatar} alt={user.name} size="md" status={user.status} />
      <div className="min-w-0 flex-1">
        <p className="font-medium">{user.name}</p>
        <p className="text-sm text-hiqu-muted">{user.statusText || `@${user.username}`}</p>
      </div>
      <div className="flex gap-2">
        {!isBlocked && (
          <button
            onClick={onMessage}
            className="flex size-9 items-center justify-center rounded-full bg-hiqu-elevated text-hiqu-muted opacity-0 transition-opacity hover:text-hiqu-text group-hover:opacity-100"
          >
            <MessageSquare className="size-4" />
          </button>
        )}
        <button
          onClick={() => setMenu(!menu)}
          className="flex size-9 items-center justify-center rounded-full bg-hiqu-elevated text-hiqu-muted hover:text-hiqu-text"
        >
          <MoreHorizontal className="size-4" />
        </button>
      </div>
      {menu && (
        <div className="absolute right-2 top-12 z-10 rounded-lg bg-hiqu-elevated py-1 shadow-xl">
          {isBlocked ? (
            <MenuBtn icon={Check} label="Engeli Kaldır" onClick={() => { onUnblock(); setMenu(false); }} />
          ) : (
            <>
              <MenuBtn icon={UserMinus} label="Arkadaşlıktan Çıkar" onClick={() => { onRemove(); setMenu(false); }} />
              <MenuBtn icon={Ban} label="Engelle" onClick={() => { onBlock(); setMenu(false); }} danger />
            </>
          )}
        </div>
      )}
    </div>
  );
}

function PendingRow({
  user,
  onAccept,
  onDecline,
}: {
  user: User;
  onAccept: () => void;
  onDecline: () => void;
}) {
  return (
    <div className="mb-1 flex items-center gap-3 rounded-md px-2 py-2 hover:bg-hiqu-panel/80">
      <Avatar src={user.avatar} alt={user.name} size="md" />
      <div className="flex-1">
        <p className="font-medium">{user.name}</p>
        <p className="text-sm text-hiqu-muted">@{user.username}</p>
      </div>
      <button onClick={onAccept} className="rounded-full bg-hiqu-online/20 p-2 text-hiqu-online hover:bg-hiqu-online/30">
        <Check className="size-4" />
      </button>
      <button onClick={onDecline} className="rounded-full bg-hiqu-elevated p-2 text-hiqu-muted hover:text-hiqu-dnd">
        <X className="size-4" />
      </button>
    </div>
  );
}

function MenuBtn({
  icon: Icon,
  label,
  onClick,
  danger,
}: {
  icon: typeof Check;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-hiqu-hover ${
        danger ? "text-hiqu-dnd" : "text-hiqu-text"
      }`}
    >
      <Icon className="size-4" />
      {label}
    </button>
  );
}

function EmptyState({ tab, onAddFriend }: { tab: FriendsTab; onAddFriend: () => void }) {
  const messages: Record<FriendsTab, string> = {
    online: "Çevrimiçi arkadaş yok.",
    all: "Henüz arkadaşın yok. Kullanıcı adıyla arkadaş ekle!",
    pending: "",
    blocked: "Engellenmiş kullanıcı yok.",
  };
  return (
    <div className="mt-12 text-center">
      <p className="text-hiqu-muted">{messages[tab]}</p>
      {tab === "all" && (
        <button onClick={onAddFriend} className="mt-4 text-hiqu-accent hover:underline">
          Arkadaş Ekle
        </button>
      )}
    </div>
  );
}
