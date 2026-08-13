import {
  Bell,
  Camera,
  Globe,
  Lock,
  Palette,
  Pencil,
  Server,
  User,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { AccountUser, Server as ServerType, SettingsTab, Status, UserSettings } from "../types";
import { t } from "../i18n";
import { readImageFile } from "../lib/images";
import { applyTheme, isValidTheme, THEMES } from "../lib/settings";
import { ConfirmDialog } from "./ConfirmDialog";

interface SettingsPanelProps {
  account: AccountUser;
  activeServer: ServerType | null;
  isServerOwner: boolean;
  initialTab?: SettingsTab;
  onClose: () => void;
  onSaveProfile: (data: {
    name?: string;
    statusText?: string;
    status?: Status;
    avatar?: string;
    banner?: string;
    bio?: string;
    accentColor?: string;
  }) => Promise<void>;
  onUploadImage: (kind: "avatar" | "banner", dataUrl: string) => Promise<AccountUser>;
  onSaveSettings: (settings: Partial<UserSettings>) => Promise<void>;
  onChangePassword: (current: string, next: string) => Promise<void>;
  onLogout: () => Promise<void>;
  onDeleteAccount: (password: string) => Promise<void>;
  onSaveServer: (data: {
    name?: string;
    icon?: string;
    banner?: string;
    description?: string;
  }) => Promise<ServerType>;
  onRegenerateInvite: () => Promise<ServerType>;
  onUploadServerImage: (kind: "icon" | "banner", dataUrl: string) => Promise<ServerType>;
}

const userTabs: { id: SettingsTab; icon: typeof User; labelKey: string }[] = [
  { id: "account", icon: User, labelKey: "settings.account" },
  { id: "profile", icon: User, labelKey: "settings.profile" },
  { id: "appearance", icon: Palette, labelKey: "settings.appearance" },
  { id: "notifications", icon: Bell, labelKey: "settings.notifications" },
  { id: "privacy", icon: Lock, labelKey: "settings.privacy" },
  { id: "language", icon: Globe, labelKey: "settings.language" },
];

function isServerTab(tab: SettingsTab) {
  return tab === "server-overview" || tab === "server-appearance";
}

export function SettingsPanel({
  account,
  activeServer,
  isServerOwner,
  initialTab = "account",
  onClose,
  onSaveProfile,
  onUploadImage,
  onSaveSettings,
  onChangePassword,
  onLogout,
  onDeleteAccount,
  onSaveServer,
  onRegenerateInvite,
  onUploadServerImage,
}: SettingsPanelProps) {
  const serverMode = isServerTab(initialTab);
  const [tab, setTab] = useState<SettingsTab>(initialTab);
  const [saved, setSaved] = useState(false);
  const lang = account.settings.language;

  const flash = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const serverTabs: { id: SettingsTab; icon: typeof Server; labelKey: string }[] = isServerOwner
    ? [
        { id: "server-overview", icon: Server, labelKey: "settings.serverOverview" },
        { id: "server-appearance", icon: Palette, labelKey: "settings.serverAppearance" },
      ]
    : [];

  useEffect(() => {
    applyTheme(account.settings.theme);
  }, [account.settings.theme]);

  useEffect(() => {
    if (serverMode) {
      const valid = serverTabs.some((item) => item.id === initialTab);
      setTab(valid ? initialTab : "server-overview");
    } else {
      const valid = userTabs.some((item) => item.id === initialTab);
      setTab(valid ? initialTab : "account");
    }
  }, [initialTab, isServerOwner, activeServer?.id, serverMode]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        className="flex h-[85vh] w-full max-w-4xl overflow-hidden rounded-xl bg-hiqu-panel shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <aside className="flex w-56 shrink-0 flex-col border-r border-hiqu-border bg-hiqu-surface">
          <div className="flex items-center justify-between border-b border-hiqu-border px-4 py-3">
            <span className="font-semibold">
              {serverMode
                ? lang === "tr"
                  ? "Sunucu Ayarları"
                  : "Server Settings"
                : t(lang, "settings.title")}
            </span>
            <button onClick={onClose} className="text-hiqu-muted hover:text-hiqu-text">
              <X className="size-5" />
            </button>
          </div>
          <nav className="flex-1 overflow-y-auto p-2">
            {!serverMode &&
              userTabs.map((item) => (
                <NavBtn
                  key={item.id}
                  active={tab === item.id}
                  icon={item.icon}
                  label={t(lang, item.labelKey)}
                  onClick={() => setTab(item.id)}
                />
              ))}
            {serverMode &&
              serverTabs.map((item) => (
                <NavBtn
                  key={item.id}
                  active={tab === item.id}
                  icon={item.icon}
                  label={t(lang, item.labelKey)}
                  onClick={() => setTab(item.id)}
                />
              ))}
          </nav>
          {saved && (
            <p className="border-t border-hiqu-border px-4 py-2 text-xs text-hiqu-online">
              {t(lang, "settings.saved")}
            </p>
          )}
        </aside>

        <main className="flex-1 overflow-y-auto p-6">
          {tab === "account" && (
            <AccountSection
              account={account}
              lang={lang}
              onPassword={async (c, n) => {
                await onChangePassword(c, n);
                flash();
              }}
              onLogout={onLogout}
              onDeleteAccount={onDeleteAccount}
            />
          )}
          {tab === "profile" && (
            <ProfileSection
              account={account}
              lang={lang}
              onSave={async (d) => {
                await onSaveProfile(d);
                flash();
              }}
              onUploadImage={onUploadImage}
            />
          )}
          {tab === "appearance" && (
            <AppearanceSection
              settings={account.settings}
              lang={lang}
              onSave={async (d) => {
                await onSaveSettings(d);
                if (d.theme) applyTheme(d.theme);
                flash();
              }}
            />
          )}
          {tab === "notifications" && (
            <ToggleSection
              settings={account.settings}
              lang={lang}
              keys={["notifyDm", "notifyFriends", "notifyServer", "notifyMention"]}
              onSave={async (d) => {
                await onSaveSettings(d);
                flash();
              }}
            />
          )}
          {tab === "privacy" && (
            <ToggleSection
              settings={account.settings}
              lang={lang}
              keys={["privacyShowStatus", "privacyAllowFriendRequests", "privacyShowEmail"]}
              onSave={async (d) => {
                await onSaveSettings(d);
                flash();
              }}
            />
          )}
          {tab === "language" && (
            <LanguageSection
              settings={account.settings}
              onSave={async (d) => {
                await onSaveSettings(d);
                flash();
              }}
            />
          )}
          {tab === "server-overview" && activeServer && (
            <ServerOverviewSection
              server={activeServer}
              lang={lang}
              onSave={async (d) => {
                await onSaveServer(d);
                flash();
              }}
              onRegenerate={async () => onRegenerateInvite()}
            />
          )}
          {tab === "server-appearance" && activeServer && (
            <ServerAppearanceSection
              server={activeServer}
              lang={lang}
              onUploadImage={onUploadServerImage}
            />
          )}
        </main>
      </div>
    </div>
  );
}

function NavBtn({
  active,
  icon: Icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: typeof User;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`mb-0.5 flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm ${
        active ? "bg-hiqu-hover text-hiqu-text" : "text-hiqu-muted hover:bg-hiqu-hover/60 hover:text-hiqu-text"
      }`}
    >
      <Icon className="size-4" />
      {label}
    </button>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <label className="mb-1.5 block text-xs font-semibold uppercase text-hiqu-muted">{label}</label>
      {children}
    </div>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-lg border border-hiqu-border/60 bg-hiqu-bg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-hiqu-accent ${props.className ?? ""}`}
    />
  );
}

function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`w-full rounded-lg border border-hiqu-border/60 bg-hiqu-bg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-hiqu-accent ${props.className ?? ""}`}
    />
  );
}

function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`w-full rounded-lg border border-hiqu-border/60 bg-hiqu-bg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-hiqu-accent ${props.className ?? ""}`}
    />
  );
}

function SaveBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-lg bg-hiqu-accent px-4 py-2 text-sm font-semibold text-white hover:bg-hiqu-accent-hover"
    >
      {label}
    </button>
  );
}

function AccountSection({
  account,
  lang,
  onPassword,
  onLogout,
  onDeleteAccount,
}: {
  account: AccountUser;
  lang: AccountUser["settings"]["language"];
  onPassword: (c: string, n: string) => Promise<void>;
  onLogout: () => Promise<void>;
  onDeleteAccount: (password: string) => Promise<void>;
}) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [error, setError] = useState("");
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [logoutConfirm, setLogoutConfirm] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  return (
    <div className="max-w-lg">
      {logoutConfirm && (
        <ConfirmDialog
          title={t(lang, "settings.logoutConfirmTitle")}
          message={t(lang, "settings.logoutConfirmMessage")}
          confirmLabel={t(lang, "settings.yes")}
          cancelLabel={t(lang, "settings.no")}
          onConfirm={async () => {
            setLogoutConfirm(false);
            await onLogout();
          }}
          onCancel={() => setLogoutConfirm(false)}
        />
      )}
      {deleteConfirm && (
        <ConfirmDialog
          title={t(lang, "settings.deleteConfirmTitle")}
          message={t(lang, "settings.deleteConfirmMessage")}
          confirmLabel={t(lang, "settings.yes")}
          cancelLabel={t(lang, "settings.no")}
          danger
          onConfirm={async () => {
            setDeleteError("");
            try {
              await onDeleteAccount(deletePassword);
              setDeleteConfirm(false);
            } catch (e) {
              setDeleteError(e instanceof Error ? e.message : "Hata");
            }
          }}
          onCancel={() => {
            setDeleteConfirm(false);
            setDeletePassword("");
            setDeleteError("");
          }}
        >
          <Field label={t(lang, "settings.currentPassword")}>
            <Input
              type="password"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
            />
          </Field>
          {deleteError && <p className="mt-2 text-sm text-hiqu-dnd">{deleteError}</p>}
        </ConfirmDialog>
      )}

      <h2 className="mb-6 text-xl font-bold">{t(lang, "settings.account")}</h2>
      <Field label={t(lang, "settings.email")}>
        <Input value={account.email} readOnly />
      </Field>
      <Field label={t(lang, "settings.username")}>
        <Input value={`@${account.username}`} readOnly />
      </Field>
      <Field label={t(lang, "settings.memberSince")}>
        <Input value={account.memberSince} readOnly />
      </Field>
      <hr className="my-6 border-hiqu-border" />
      <h3 className="mb-4 font-semibold">{t(lang, "settings.changePassword")}</h3>
      <Field label={t(lang, "settings.currentPassword")}>
        <Input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} />
      </Field>
      <Field label={t(lang, "settings.newPassword")}>
        <Input type="password" value={next} onChange={(e) => setNext(e.target.value)} />
      </Field>
      {error && <p className="mb-2 text-sm text-hiqu-dnd">{error}</p>}
      <SaveBtn
        label={t(lang, "settings.changePassword")}
        onClick={async () => {
          setError("");
          try {
            await onPassword(current, next);
            setCurrent("");
            setNext("");
          } catch (e) {
            setError(e instanceof Error ? e.message : "Hata");
          }
        }}
      />

      <hr className="my-6 border-hiqu-border" />
      <h3 className="mb-2 font-semibold">{t(lang, "settings.accountActions")}</h3>
      <p className="mb-4 text-sm text-hiqu-muted">{t(lang, "settings.accountActionsHint")}</p>
      <div className="space-y-2">
        <button
          type="button"
          onClick={() => setLogoutConfirm(true)}
          className="w-full rounded-lg border border-hiqu-border px-4 py-2.5 text-left text-sm hover:bg-hiqu-hover"
        >
          {t(lang, "settings.logout")}
        </button>
        <button
          type="button"
          onClick={() => setDeleteConfirm(true)}
          className="w-full rounded-lg border border-hiqu-dnd/40 px-4 py-2.5 text-left text-sm text-hiqu-dnd hover:bg-hiqu-dnd/10"
        >
          {t(lang, "settings.deleteAccount")}
        </button>
      </div>
    </div>
  );
}

function ProfileSection({
  account,
  lang,
  onSave,
  onUploadImage,
}: {
  account: AccountUser;
  lang: AccountUser["settings"]["language"];
  onSave: (d: Record<string, string | Status>) => Promise<void>;
  onUploadImage: (kind: "avatar" | "banner", dataUrl: string) => Promise<AccountUser>;
}) {
  const [name, setName] = useState(account.name);
  const [statusText, setStatusText] = useState(account.statusText ?? "");
  const [status, setStatus] = useState<Status>(account.status);
  const [avatar, setAvatar] = useState(account.avatar);
  const [banner, setBanner] = useState(account.banner ?? "");
  const [bio, setBio] = useState(account.bio ?? "");
  const [uploadError, setUploadError] = useState("");
  const [uploading, setUploading] = useState<"avatar" | "banner" | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setName(account.name);
    setStatusText(account.statusText ?? "");
    setStatus(account.status);
    setAvatar(account.avatar);
    setBanner(account.banner ?? "");
    setBio(account.bio ?? "");
  }, [account]);

  const statusDot: Record<Status, string> = {
    online: "bg-hiqu-online",
    idle: "bg-hiqu-idle",
    dnd: "bg-hiqu-dnd",
    offline: "bg-hiqu-muted",
  };

  async function handleImagePick(kind: "avatar" | "banner", file: File) {
    try {
      setUploadError("");
      setUploading(kind);
      const dataUrl = await readImageFile(file);
      const user = await onUploadImage(kind, dataUrl);
      setAvatar(user.avatar);
      setBanner(user.banner ?? "");
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Yükleme başarısız");
    } finally {
      setUploading(null);
    }
  }

  return (
    <div className="max-w-xl">
      <h2 className="mb-6 text-xl font-bold">{t(lang, "settings.profile")}</h2>

      <div className="overflow-hidden rounded-lg bg-hiqu-elevated">
        <button
          type="button"
          onClick={() => bannerInputRef.current?.click()}
          disabled={uploading !== null}
          className="group/banner relative block h-[124px] w-full overflow-hidden disabled:cursor-wait"
        >
          {banner ? (
            <img src={banner} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full bg-hiqu-accent/30" />
          )}
          <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 transition-opacity group-hover/banner:opacity-100">
            <Camera className="size-5 text-white" />
            <span className="text-sm font-medium text-white">
              {lang === "tr" ? "Banner Değiştir" : "Change Banner"}
            </span>
          </div>
          {uploading === "banner" && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/55 text-sm text-white">
              {lang === "tr" ? "Yükleniyor..." : "Uploading..."}
            </div>
          )}
        </button>

        <div className="relative px-4 pb-5">
          <button
            type="button"
            onClick={() => avatarInputRef.current?.click()}
            disabled={uploading !== null}
            className="group/avatar absolute -top-10 left-4 z-10 disabled:cursor-wait"
          >
            <div className="relative">
              <img
                src={avatar}
                alt=""
                className="size-20 rounded-full border-[5px] border-hiqu-elevated bg-hiqu-panel object-cover"
              />
              <span
                className={`absolute bottom-0.5 right-0.5 size-4 rounded-full border-[3px] border-hiqu-elevated ${statusDot[status]}`}
              />
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/55 opacity-0 transition-opacity group-hover/avatar:opacity-100">
                <Pencil className="size-5 text-white" />
              </div>
              {uploading === "avatar" && (
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/55 text-xs text-white">
                  ...
                </div>
              )}
            </div>
          </button>

          <div className="space-y-4 pt-12">
            <Field label={t(lang, "settings.displayName")}>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </Field>
            <Field label={t(lang, "settings.statusMessage")}>
              <Input
                value={statusText}
                onChange={(e) => setStatusText(e.target.value)}
                placeholder={lang === "tr" ? "+ Son hobi?" : "+ Latest hobby?"}
              />
            </Field>
            <Field label={t(lang, "settings.status")}>
              <Select value={status} onChange={(e) => setStatus(e.target.value as Status)}>
                <option value="online">{t(lang, "settings.status.online")}</option>
                <option value="idle">{t(lang, "settings.status.idle")}</option>
                <option value="dnd">{t(lang, "settings.status.dnd")}</option>
              </Select>
            </Field>
            <Field label={t(lang, "settings.bio")}>
              <Textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                placeholder={lang === "tr" ? "Kendinden bahset..." : "Tell us about yourself..."}
              />
            </Field>
          </div>
        </div>
      </div>

      <input
        ref={avatarInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleImagePick("avatar", file);
          e.target.value = "";
        }}
      />
      <input
        ref={bannerInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleImagePick("banner", file);
          e.target.value = "";
        }}
      />

      {uploadError && <p className="mt-3 text-sm text-hiqu-dnd">{uploadError}</p>}

      <div className="mt-6">
        <SaveBtn
          label={t(lang, "settings.save")}
          onClick={() => onSave({ name, statusText, status, bio })}
        />
      </div>
    </div>
  );
}

function AppearanceSection({
  settings,
  lang,
  onSave,
}: {
  settings: UserSettings;
  lang: UserSettings["language"];
  onSave: (d: Partial<UserSettings>) => Promise<void>;
}) {
  return (
    <div className="max-w-2xl">
      <h2 className="mb-6 text-xl font-bold">{t(lang, "settings.appearance")}</h2>

      <Field label={lang === "tr" ? "Temalar" : "Themes"}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {THEMES.map((th) => (
            <ThemeSwatch
              key={th.id}
              active={
                settings.theme === th.id ||
                (!isValidTheme(settings.theme) && th.id === "midnight")
              }
              preview={th.preview}
              label={lang === "tr" ? th.labelTr : th.labelEn}
              onClick={() => onSave({ theme: th.id })}
            />
          ))}
        </div>
      </Field>
    </div>
  );
}

function ThemeSwatch({
  active,
  preview,
  label,
  onClick,
}: {
  active: boolean;
  preview: [string, string];
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={`group flex flex-col items-center gap-1.5 rounded-lg p-1 ${
        active ? "ring-2 ring-hiqu-accent ring-offset-2 ring-offset-hiqu-panel" : ""
      }`}
    >
      <div
        className="size-14 rounded-xl border border-hiqu-border shadow-sm transition-transform group-hover:scale-105"
        style={{ background: `linear-gradient(135deg, ${preview[0]}, ${preview[1]})` }}
      />
      <span className="max-w-full truncate text-[10px] text-hiqu-muted">{label}</span>
    </button>
  );
}

function ToggleSection({
  settings,
  lang,
  keys,
  onSave,
}: {
  settings: UserSettings;
  lang: UserSettings["language"];
  keys: (keyof UserSettings)[];
  onSave: (d: Partial<UserSettings>) => Promise<void>;
}) {
  return (
    <div className="max-w-lg space-y-3">
      <h2 className="mb-4 text-xl font-bold">
        {keys[0]?.startsWith("notify") ? t(lang, "settings.notifications") : t(lang, "settings.privacy")}
      </h2>
      {keys.map((key) => (
        <label key={key} className="flex cursor-pointer items-center justify-between rounded-lg bg-hiqu-elevated px-4 py-3">
          <span className="text-sm">{t(lang, `settings.${key}`)}</span>
          <input
            type="checkbox"
            checked={Boolean(settings[key])}
            onChange={(e) => onSave({ [key]: e.target.checked })}
            className="size-4 accent-hiqu-accent"
          />
        </label>
      ))}
    </div>
  );
}

function LanguageSection({
  settings,
  onSave,
}: {
  settings: UserSettings;
  onSave: (d: Partial<UserSettings>) => Promise<void>;
}) {
  return (
    <div className="max-w-lg">
      <h2 className="mb-6 text-xl font-bold">{t(settings.language, "settings.language")}</h2>
      <div className="grid grid-cols-2 gap-2">
        {(["tr", "en"] as const).map((l) => (
          <button
            key={l}
            onClick={() => onSave({ language: l })}
            className={`rounded-lg border-2 px-4 py-3 text-sm font-medium ${
              settings.language === l ? "border-hiqu-accent bg-hiqu-hover" : "border-hiqu-border bg-hiqu-elevated"
            }`}
          >
            {l === "tr" ? "Türkçe" : "English"}
          </button>
        ))}
      </div>
    </div>
  );
}

function ServerOverviewSection({
  server,
  lang,
  onSave,
  onRegenerate,
}: {
  server: ServerType;
  lang: UserSettings["language"];
  onSave: (d: { name?: string; description?: string }) => Promise<void>;
  onRegenerate: () => Promise<ServerType>;
}) {
  const [name, setName] = useState(server.name);
  const [description, setDescription] = useState(server.description ?? "");
  const [invite, setInvite] = useState(server.inviteCode);

  return (
    <div className="max-w-lg">
      <h2 className="mb-6 text-xl font-bold">{t(lang, "settings.serverOverview")}</h2>
      <Field label={t(lang, "settings.serverName")}>
        <Input value={name} onChange={(e) => setName(e.target.value)} />
      </Field>
      <Field label={t(lang, "settings.serverDescription")}>
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} />
      </Field>
      <Field label={t(lang, "settings.inviteCode")}>
        <div className="flex gap-2">
          <Input value={invite} readOnly className="font-mono tracking-widest" />
          <button
            type="button"
            onClick={async () => {
              const s = await onRegenerate();
              setInvite(s.inviteCode);
            }}
            className="shrink-0 rounded-lg bg-hiqu-elevated px-3 text-sm hover:bg-hiqu-hover"
          >
            {t(lang, "settings.regenerateInvite")}
          </button>
        </div>
      </Field>
      <SaveBtn label={t(lang, "settings.save")} onClick={() => onSave({ name, description })} />
    </div>
  );
}

function ServerAppearanceSection({
  server,
  lang,
  onUploadImage,
}: {
  server: ServerType;
  lang: UserSettings["language"];
  onUploadImage: (kind: "icon" | "banner", dataUrl: string) => Promise<ServerType>;
}) {
  const [icon, setIcon] = useState(server.icon);
  const [banner, setBanner] = useState(server.banner ?? "");
  const [uploadError, setUploadError] = useState("");
  const [uploading, setUploading] = useState<"icon" | "banner" | null>(null);
  const iconInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setIcon(server.icon);
    setBanner(server.banner ?? "");
  }, [server]);

  async function handleImagePick(kind: "icon" | "banner", file: File) {
    try {
      setUploadError("");
      setUploading(kind);
      const dataUrl = await readImageFile(file);
      const updated = await onUploadImage(kind, dataUrl);
      setIcon(updated.icon);
      setBanner(updated.banner ?? "");
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Yükleme başarısız");
    } finally {
      setUploading(null);
    }
  }

  return (
    <div className="max-w-xl">
      <h2 className="mb-6 text-xl font-bold">{t(lang, "settings.serverAppearance")}</h2>

      <div className="overflow-hidden rounded-lg bg-hiqu-elevated">
        <button
          type="button"
          onClick={() => bannerInputRef.current?.click()}
          disabled={uploading !== null}
          className="group/banner relative block h-[124px] w-full overflow-hidden disabled:cursor-wait"
        >
          {banner ? (
            <img src={banner} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full bg-hiqu-accent/30" />
          )}
          <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 transition-opacity group-hover/banner:opacity-100">
            <Camera className="size-5 text-white" />
            <span className="text-sm font-medium text-white">
              {lang === "tr" ? "Banner Değiştir" : "Change Banner"}
            </span>
          </div>
          {uploading === "banner" && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/55 text-sm text-white">
              {lang === "tr" ? "Yükleniyor..." : "Uploading..."}
            </div>
          )}
        </button>

        <div className="relative px-4 pb-5">
          <button
            type="button"
            onClick={() => iconInputRef.current?.click()}
            disabled={uploading !== null}
            className="group/icon absolute -top-10 left-4 z-10 disabled:cursor-wait"
          >
            <div className="relative">
              <img
                src={icon}
                alt=""
                className="size-20 rounded-2xl border-[5px] border-hiqu-elevated bg-hiqu-panel object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/55 opacity-0 transition-opacity group-hover/icon:opacity-100">
                <Pencil className="size-5 text-white" />
              </div>
              {uploading === "icon" && (
                <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/55 text-xs text-white">
                  ...
                </div>
              )}
            </div>
          </button>

          <p className="pt-12 text-sm text-hiqu-muted">
            {lang === "tr"
              ? "İkon veya banner'a tıklayarak bilgisayarından görsel yükle."
              : "Click the icon or banner to upload from your computer."}
          </p>
        </div>
      </div>

      <input
        ref={iconInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleImagePick("icon", file);
          e.target.value = "";
        }}
      />
      <input
        ref={bannerInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleImagePick("banner", file);
          e.target.value = "";
        }}
      />

      {uploadError && <p className="mt-3 text-sm text-hiqu-dnd">{uploadError}</p>}
    </div>
  );
}
