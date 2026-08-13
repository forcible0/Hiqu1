import { PanelRightClose, Search } from "lucide-react";
import type { User } from "../types";
import { Avatar } from "./Avatar";

interface ProfileSidebarProps {
  user: User;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onHide: () => void;
  onViewFullProfile: () => void;
}

export function ProfileSidebar({ user, searchQuery, onSearchChange, onHide, onViewFullProfile }: ProfileSidebarProps) {
  const bannerStyle = user.banner
    ? { backgroundImage: `url(${user.banner})` }
    : user.accentColor
      ? { backgroundColor: user.accentColor }
      : undefined;

  return (
    <aside className="hiqu-sidebar flex h-full w-80 shrink-0 flex-col overflow-hidden border-l border-hiqu-border/40">
      <div className="flex shrink-0 items-center gap-2 border-b border-hiqu-border/40 px-3 py-2.5">
        <button
          type="button"
          onClick={onHide}
          title="Kullanıcı profilini gizle"
          className="flex size-8 shrink-0 items-center justify-center rounded text-hiqu-muted transition-colors hover:bg-hiqu-hover hover:text-hiqu-text"
        >
          <PanelRightClose className="size-5" />
        </button>
        <div className="hiqu-search flex min-w-0 flex-1 items-center gap-2 rounded-md px-2.5 py-1.5">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={`${user.username} ara`}
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-hiqu-muted"
          />
          <Search className="size-4 shrink-0 text-hiqu-muted" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div
          className="relative h-[124px] bg-hiqu-banner bg-cover bg-center"
          style={bannerStyle}
        />

        <div className="relative px-4 pb-4">
          <div className="absolute -top-12 left-4">
            <Avatar
              src={user.avatar}
              alt={user.name}
              size="xl"
              status={user.status}
              statusBorderClass="border-hiqu-panel"
              className="[&_img]:border-[5px] [&_img]:border-hiqu-panel"
            />
          </div>

          <div className="pt-14">
            <h2 className="text-xl font-bold leading-tight text-hiqu-text">{user.name}</h2>
            <p className="text-sm text-hiqu-muted">@{user.username}</p>

            {user.statusText && (
              <p className="mt-3 text-sm leading-relaxed text-hiqu-text">{user.statusText}</p>
            )}

            {user.bio && (
              <p className="mt-3 text-sm leading-relaxed text-hiqu-text">{user.bio}</p>
            )}

            <div className="mt-5">
              <p className="text-xs font-bold uppercase tracking-wide text-hiqu-muted">
                Üyelik Tarihi
              </p>
              <p className="mt-1 text-sm text-hiqu-text">{user.memberSince}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="shrink-0 border-t border-hiqu-border/40 p-3">
        <button
          type="button"
          onClick={onViewFullProfile}
          className="w-full rounded-md bg-hiqu-elevated py-2.5 text-sm font-medium text-hiqu-text transition-colors hover:bg-hiqu-hover"
        >
          Tam Profili Gör
        </button>
      </div>
    </aside>
  );
}
