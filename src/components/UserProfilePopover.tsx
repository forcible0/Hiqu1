import { ChevronRight, Pencil, UserRound } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { AccountUser, Status } from "../types";
import { Avatar } from "./Avatar";

const STATUS_LABELS: Record<Status, string> = {
  online: "Çevrimiçi",
  idle: "Boşta",
  dnd: "Rahatsız Etmeyin",
  offline: "Görünmez",
};

const STATUS_COLORS: Record<Status, string> = {
  online: "bg-hiqu-online",
  idle: "bg-hiqu-idle",
  dnd: "bg-hiqu-dnd",
  offline: "bg-hiqu-muted",
};

const POPOVER_STATUSES: Status[] = ["online", "idle", "dnd"];

interface UserProfilePopoverProps {
  user: AccountUser;
  open: boolean;
  onClose: () => void;
  onEditProfile: () => void;
  onSetStatus: (status: Status) => void;
  onSwitchAccount: () => void;
}

export function UserProfilePopover({
  user,
  open,
  onClose,
  onEditProfile,
  onSetStatus,
  onSwitchAccount,
}: UserProfilePopoverProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [statusOpen, setStatusOpen] = useState(false);

  useEffect(() => {
    if (!open) {
      setStatusOpen(false);
      return;
    }
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open, onClose]);

  if (!open) return null;

  const handleSetStatus = (status: Status) => {
    onSetStatus(status);
    setStatusOpen(false);
  };

  return (
    <div
      ref={ref}
      className="absolute bottom-full left-0 z-50 mb-2 w-[300px] overflow-hidden rounded-lg bg-hiqu-elevated shadow-2xl"
    >
      <div
        className="h-[92px] w-full bg-hiqu-accent bg-cover bg-center"
        style={user.banner ? { backgroundImage: `url(${user.banner})` } : undefined}
      />

      <div className="relative px-4 pb-3">
        <div className="absolute -top-10 left-4">
          <Avatar
            src={user.avatar}
            alt={user.name}
            size="xl"
            status={user.status}
            statusBorderClass="border-hiqu-elevated"
            className="[&_img]:border-4 [&_img]:border-hiqu-elevated"
          />
        </div>

        <div className="pt-12">
          <p className="text-xl font-bold leading-tight">{user.name}</p>
          <p className="text-sm text-hiqu-muted">@{user.username}</p>
        </div>
      </div>

      <div className="mx-3 border-t border-hiqu-border/40" />

      <div className="py-1.5">
        <button
          onClick={() => {
            onEditProfile();
            onClose();
          }}
          className="flex w-full items-center gap-3 px-3 py-2.5 text-sm hover:bg-hiqu-hover"
        >
          <Pencil className="size-4 text-hiqu-muted" />
          Profili Düzenle
        </button>

        <button
          type="button"
          onClick={() => setStatusOpen((v) => !v)}
          className="flex w-full items-center gap-3 px-3 py-2.5 text-sm hover:bg-hiqu-hover"
        >
          <span className={`size-3 shrink-0 rounded-full ${STATUS_COLORS[user.status]}`} />
          {STATUS_LABELS[user.status]}
          <ChevronRight
            className={`ml-auto size-4 text-hiqu-muted transition-transform ${statusOpen ? "rotate-90" : ""}`}
          />
        </button>

        {statusOpen && (
          <div className="mx-2 mb-1 rounded-md bg-hiqu-panel/80 py-1">
            {POPOVER_STATUSES.map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => handleSetStatus(status)}
                className={`flex w-full items-center gap-3 px-3 py-2 text-sm hover:bg-hiqu-hover ${
                  user.status === status ? "text-hiqu-text" : "text-hiqu-muted"
                }`}
              >
                <span className={`size-3 shrink-0 rounded-full ${STATUS_COLORS[status]}`} />
                {STATUS_LABELS[status]}
              </button>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={() => {
            onClose();
            onSwitchAccount();
          }}
          className="flex w-full items-center gap-3 px-3 py-2.5 text-sm hover:bg-hiqu-hover"
        >
          <UserRound className="size-4 text-hiqu-muted" />
          Hesap Değiştir
          <ChevronRight className="ml-auto size-4 text-hiqu-muted" />
        </button>
      </div>
    </div>
  );
}
