import { LogOut, Settings } from "lucide-react";
import { useState } from "react";
import type { AccountUser, Status } from "../types";
import { Avatar } from "./Avatar";
import { ConfirmDialog } from "./ConfirmDialog";
import { UserProfilePopover } from "./UserProfilePopover";

interface UserPanelProps {
  user: AccountUser;
  onSettings: () => void;
  onLogout: () => void;
  onEditProfile: () => void;
  onSetStatus: (status: Status) => void;
}

export function UserPanel({ user, onSettings, onLogout, onEditProfile, onSetStatus }: UserPanelProps) {
  const [profileOpen, setProfileOpen] = useState(false);
  const [logoutConfirm, setLogoutConfirm] = useState(false);

  return (
    <div className="relative mt-auto">
      {logoutConfirm && (
        <ConfirmDialog
          title="Hesaptan çıkış"
          message="Hesaptan çıkış yapılacaktır, emin misiniz?"
          confirmLabel="Evet"
          cancelLabel="Hayır"
          onConfirm={() => {
            setLogoutConfirm(false);
            onLogout();
          }}
          onCancel={() => setLogoutConfirm(false)}
        />
      )}

      <UserProfilePopover
        user={user}
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        onEditProfile={onEditProfile}
        onSetStatus={onSetStatus}
        onSwitchAccount={() => setLogoutConfirm(true)}
      />

      <div className="hiqu-user-panel flex items-center gap-2 px-2 py-2">
        <button
          type="button"
          onClick={() => setProfileOpen((v) => !v)}
          className="flex min-w-0 flex-1 items-center gap-2 rounded-md p-1 text-left transition-colors hover:bg-hiqu-hover/60"
        >
          <Avatar src={user.avatar} alt={user.name} size="sm" status={user.status} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{user.name}</p>
            <p className="truncate text-xs text-hiqu-muted">{user.statusText || `@${user.username}`}</p>
          </div>
        </button>
        <div className="flex gap-0.5">
          <button
            onClick={onSettings}
            title="Ayarlar"
            className="rounded p-1.5 text-hiqu-muted transition-colors hover:bg-hiqu-hover hover:text-hiqu-text"
          >
            <Settings className="size-4" />
          </button>
          <button
            onClick={() => setLogoutConfirm(true)}
            title="Çıkış"
            className="rounded p-1.5 text-hiqu-muted transition-colors hover:bg-hiqu-hover hover:text-hiqu-dnd"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
