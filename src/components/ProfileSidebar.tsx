import type { User } from "../types";
import { Avatar } from "./Avatar";

interface ProfileSidebarProps {
  user: User;
  onMessage: () => void;
}

export function ProfileSidebar({ user, onMessage }: ProfileSidebarProps) {
  return (
    <aside className="flex w-60 shrink-0 flex-col bg-hiqu-panel">
      <div className="relative h-24 bg-hiqu-banner" />
      <div className="px-4 pb-4">
        <div className="-mt-10 mb-3">
          <Avatar src={user.avatar} alt={user.name} size="xl" status={user.status} />
        </div>
        <h2 className="text-lg font-bold">{user.name}</h2>
        <p className="text-sm text-hiqu-muted">@{user.username}</p>
        {user.statusText && (
          <p className="mt-3 rounded-md bg-hiqu-elevated px-3 py-2 text-sm">{user.statusText}</p>
        )}
        <p className="mt-4 text-xs font-semibold uppercase text-hiqu-muted">Üyelik</p>
        <p className="text-sm">{user.memberSince}</p>
      </div>
      <div className="mt-auto p-4">
        <button
          onClick={onMessage}
          className="w-full rounded-md bg-hiqu-accent py-2.5 text-sm font-medium text-white hover:bg-hiqu-accent-hover"
        >
          Mesaj Gönder
        </button>
      </div>
    </aside>
  );
}
