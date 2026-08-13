import { LogOut, Settings } from "lucide-react";
import type { User } from "../types";
import { Avatar } from "./Avatar";

interface UserPanelProps {
  user: User;
  onSettings: () => void;
  onLogout: () => void;
}

export function UserPanel({ user, onSettings, onLogout }: UserPanelProps) {
  return (
    <div className="mt-auto flex items-center gap-2 bg-hiqu-bg/60 px-2 py-2">
      <Avatar src={user.avatar} alt={user.name} size="sm" status={user.status} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{user.name}</p>
        <p className="truncate text-xs text-hiqu-muted">{user.statusText || `@${user.username}`}</p>
      </div>
      <div className="flex gap-0.5">
        <button
          onClick={onSettings}
          title="Ayarlar"
          className="rounded p-1.5 text-hiqu-muted transition-colors hover:bg-hiqu-hover hover:text-hiqu-text"
        >
          <Settings className="size-4" />
        </button>
        <button
          onClick={onLogout}
          title="Çıkış"
          className="rounded p-1.5 text-hiqu-muted transition-colors hover:bg-hiqu-hover hover:text-hiqu-dnd"
        >
          <LogOut className="size-4" />
        </button>
      </div>
    </div>
  );
}
