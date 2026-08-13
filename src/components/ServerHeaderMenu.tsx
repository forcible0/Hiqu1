import {
  Bell,
  ChevronRight,
  Copy,
  LogOut,
  Shield,
  UserPlus,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Server } from "../types";
import {
  getServerMemberSettings,
  isServerMuted,
  MUTE_OPTIONS,
  saveServerMemberSettings,
  type ServerMemberSettings,
} from "../lib/server-settings";
import { ConfirmDialog } from "./ConfirmDialog";

interface ServerHeaderMenuProps {
  server: Server;
  userId: string;
  isOwner: boolean;
  bannerMode?: boolean;
  onLeaveServer: () => Promise<void>;
}

export function ServerHeaderMenu({
  server,
  userId,
  isOwner,
  bannerMode,
  onLeaveServer,
}: ServerHeaderMenuProps) {
  const [open, setOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [notifyOpen, setNotifyOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [leaveConfirm, setLeaveConfirm] = useState(false);
  const [copied, setCopied] = useState(false);
  const [settings, setSettings] = useState<ServerMemberSettings>(() =>
    getServerMemberSettings(server.id, userId),
  );
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSettings(getServerMemberSettings(server.id, userId));
  }, [server.id, userId]);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const textClass = bannerMode ? "text-white drop-shadow-md" : "";
  const chevronClass = bannerMode ? "text-white/90" : "text-hiqu-muted";
  const muted = isServerMuted(server.id, userId);

  const copyInvite = async () => {
    await navigator.clipboard.writeText(server.inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const setMute = (ms: number) => {
    const muteUntil = ms === -1 ? -1 : Date.now() + ms;
    const next = saveServerMemberSettings(server.id, userId, { muteUntil });
    setSettings(next);
    setNotifyOpen(false);
    setOpen(false);
  };

  const clearMute = () => {
    const next = saveServerMemberSettings(server.id, userId, { muteUntil: null });
    setSettings(next);
    setNotifyOpen(false);
  };

  const updatePrivacy = (patch: Partial<ServerMemberSettings>) => {
    const next = saveServerMemberSettings(server.id, userId, patch);
    setSettings(next);
  };

  return (
    <>
      <div ref={ref} className="relative min-w-0 flex-1">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={`flex min-w-0 items-center gap-1 truncate text-left font-semibold ${textClass}`}
        >
          <span className="truncate">{server.name}</span>
          {muted && (
            <Bell className={`size-3.5 shrink-0 ${bannerMode ? "text-white/80" : "text-hiqu-dnd"}`} />
          )}
          <ChevronDownIcon open={open} className={chevronClass} />
        </button>

        {open && (
          <div className="absolute left-0 top-full z-50 mt-1 w-56 overflow-hidden rounded-lg bg-hiqu-elevated py-1.5 shadow-xl">
            <MenuItem icon={UserPlus} onClick={() => { setInviteOpen(true); setOpen(false); }}>
              Sunucuya Davet Et
            </MenuItem>
            <div className="my-1.5 border-t border-hiqu-border/50" />
            <MenuItem
              icon={Bell}
              trailing={<ChevronRight className="size-4 text-hiqu-muted" />}
              onClick={() => { setNotifyOpen(true); setOpen(false); }}
            >
              Bildirim Ayarları
            </MenuItem>
            <MenuItem
              icon={Shield}
              onClick={() => { setPrivacyOpen(true); setOpen(false); }}
            >
              Gizlilik Ayarları
            </MenuItem>
            {!isOwner && (
              <>
                <div className="my-1.5 border-t border-hiqu-border/50" />
                <MenuItem
                  icon={LogOut}
                  danger
                  onClick={() => { setLeaveConfirm(true); setOpen(false); }}
                >
                  Sunucudan Ayrıl
                </MenuItem>
              </>
            )}
          </div>
        )}
      </div>

      {inviteOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4"
          onClick={() => setInviteOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-xl bg-hiqu-panel shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-hiqu-border px-4 py-3">
              <h2 className="font-semibold">Sunucuya Davet Et</h2>
              <button onClick={() => setInviteOpen(false)} className="text-hiqu-muted hover:text-hiqu-text">
                <X className="size-5" />
              </button>
            </div>
            <div className="space-y-4 p-4">
              <p className="text-sm text-hiqu-muted">
                Arkadaşların bu kodu kullanarak <strong className="text-hiqu-text">{server.name}</strong> sunucusuna katılabilir.
              </p>
              <div className="flex items-center gap-2 rounded-lg bg-hiqu-elevated px-3 py-2.5">
                <code className="flex-1 text-lg font-bold tracking-widest">{server.inviteCode}</code>
                <button
                  onClick={copyInvite}
                  className="flex items-center gap-1 rounded-md bg-hiqu-accent px-3 py-1.5 text-sm text-white hover:bg-hiqu-accent-hover"
                >
                  <Copy className="size-4" />
                  {copied ? "Kopyalandı" : "Kopyala"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {notifyOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4"
          onClick={() => setNotifyOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-xl bg-hiqu-panel shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-hiqu-border px-4 py-3">
              <h2 className="font-semibold">Bildirim Ayarları</h2>
              <button onClick={() => setNotifyOpen(false)} className="text-hiqu-muted hover:text-hiqu-text">
                <X className="size-5" />
              </button>
            </div>
            <div className="p-2">
              <p className="px-3 py-2 text-xs font-semibold uppercase text-hiqu-muted">Sustur</p>
              {MUTE_OPTIONS.map((opt) => (
                <button
                  key={opt.label}
                  onClick={() => setMute(opt.ms)}
                  className="flex w-full rounded-md px-3 py-2 text-left text-sm hover:bg-hiqu-hover"
                >
                  {opt.label}
                </button>
              ))}
              {settings.muteUntil !== null && (
                <button
                  onClick={clearMute}
                  className="mt-1 flex w-full rounded-md px-3 py-2 text-left text-sm text-hiqu-accent hover:bg-hiqu-hover"
                >
                  Susturmayı Kaldır
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {privacyOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4"
          onClick={() => setPrivacyOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-xl bg-hiqu-panel shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-hiqu-border px-4 py-3">
              <h2 className="font-semibold">Gizlilik Ayarları — {server.name}</h2>
              <button onClick={() => setPrivacyOpen(false)} className="text-hiqu-muted hover:text-hiqu-text">
                <X className="size-5" />
              </button>
            </div>
            <div className="divide-y divide-hiqu-border/50 p-4">
              <ToggleRow
                title="Direkt Mesajlar"
                description="Bu sunucudaki diğer üyelerden DM al"
                checked={settings.allowDms}
                onChange={(v) => updatePrivacy({ allowDms: v })}
              />
              <ToggleRow
                title="Mesaj İstekleri"
                description="Tanımadığın sunucu üyelerinden gelen mesajları filtrele"
                checked={settings.filterMessageRequests}
                onChange={(v) => updatePrivacy({ filterMessageRequests: v })}
              />
              <ToggleRow
                title="Aktivitemi Paylaş"
                description="Oynadığın oyunlar ve bağlı uygulamalardan aktivite bilgini paylaş"
                checked={settings.shareActivity}
                onChange={(v) => updatePrivacy({ shareActivity: v })}
              />
              <ToggleRow
                title="Aktiviteye Katılım"
                description="Diğer kullanıcıların bu sunucuda aktivitene katılmasına izin ver"
                checked={settings.allowActivityJoin}
                onChange={(v) => updatePrivacy({ allowActivityJoin: v })}
              />
            </div>
            <div className="border-t border-hiqu-border p-4">
              <button
                onClick={() => setPrivacyOpen(false)}
                className="w-full rounded-lg bg-hiqu-accent py-2.5 text-sm font-semibold text-white hover:bg-hiqu-accent-hover"
              >
                Tamam
              </button>
            </div>
          </div>
        </div>
      )}

      {leaveConfirm && (
        <ConfirmDialog
          title="Sunucudan ayrıl"
          message={`${server.name} sunucusundan ayrılmak istediğine emin misin?`}
          confirmLabel="Ayrıl"
          cancelLabel="İptal"
          danger
          onConfirm={async () => {
            setLeaveConfirm(false);
            await onLeaveServer();
          }}
          onCancel={() => setLeaveConfirm(false)}
        />
      )}
    </>
  );
}

function ChevronDownIcon({ open, className }: { open: boolean; className: string }) {
  return (
    <svg
      className={`size-4 shrink-0 transition-transform ${open ? "rotate-180" : ""} ${className}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

function MenuItem({
  icon: Icon,
  children,
  onClick,
  danger,
  trailing,
}: {
  icon: typeof Bell;
  children: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
  trailing?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 px-3 py-2 text-sm hover:bg-hiqu-hover ${
        danger ? "text-hiqu-dnd" : "text-hiqu-text"
      }`}
    >
      <Icon className="size-4 shrink-0" />
      <span className="flex-1 text-left">{children}</span>
      {trailing}
    </button>
  );
}

function ToggleRow({
  title,
  description,
  checked,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0">
      <div>
        <p className="font-medium">{title}</p>
        <p className="mt-0.5 text-sm text-hiqu-muted">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors ${
          checked ? "bg-hiqu-accent" : "bg-hiqu-border"
        }`}
      >
        <span
          className={`absolute top-0.5 size-5 rounded-full bg-white transition-transform ${
            checked ? "left-[22px]" : "left-0.5"
          }`}
        />
      </button>
    </div>
  );
}
