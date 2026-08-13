import { useState } from "react";
import { Check } from "lucide-react";
import { useApp } from "../context/AppContext";
import { Modal } from "./Modal";
import { SettingsPanel } from "./SettingsPanel";

export function AppModals() {
  const {
    activeModal,
    setActiveModal,
    sendFriendRequest,
    createServer,
    joinServer,
    createChannel,
    updateProfile,
    updateSettings,
    changePassword,
    updateServerSettings,
    regenerateServerInvite,
    uploadProfileImage,
    uploadServerImage,
    currentUser,
    friends,
    openDm,
    openGroupDm,
    createGroupDm,
    openServer,
    logout,
    deleteAccount,
    activeServerId,
    servers,
    settingsTab,
  } = useApp();

  const close = () => setActiveModal(null);

  if (activeModal === "addFriend") {
    return <AddFriendModal onClose={close} onSend={sendFriendRequest} />;
  }
  if (activeModal === "createServer") {
    return (
      <CreateServerModal
        onClose={close}
        onCreate={async (name) => {
          const server = await createServer(name);
          close();
          await openServer(server.id);
        }}
      />
    );
  }
  if (activeModal === "joinServer") {
    return (
      <JoinServerModal
        onClose={close}
        onJoin={async (code) => {
          const server = await joinServer(code);
          close();
          await openServer(server.id);
        }}
      />
    );
  }
  if (activeModal === "createChannel") {
    return (
      <CreateChannelModal
        onClose={close}
        onCreate={async (name) => {
          await createChannel(name);
          close();
        }}
      />
    );
  }
  if (activeModal === "newDm") {
    return (
      <NewDmModal
        friends={friends}
        onClose={close}
        onSelect={(id) => {
          close();
          openDm(id);
        }}
      />
    );
  }
  if (activeModal === "newGroupDm") {
    return (
      <NewGroupDmModal
        friends={friends}
        currentUserId={currentUser?.id ?? ""}
        onClose={close}
        onCreate={async (memberIds, name) => {
          const group = await createGroupDm(memberIds, name);
          close();
          await openGroupDm(group.id);
        }}
      />
    );
  }
  if (activeModal === "settings" && currentUser) {
    const activeServer =
      activeServerId !== "home" ? servers.find((s) => s.id === activeServerId) ?? null : null;
    return (
      <SettingsPanel
        account={currentUser}
        activeServer={activeServer}
        isServerOwner={activeServer?.ownerId === currentUser.id}
        initialTab={settingsTab}
        onClose={close}
        onSaveProfile={updateProfile}
        onUploadImage={uploadProfileImage}
        onSaveSettings={updateSettings}
        onChangePassword={changePassword}
        onLogout={async () => {
          await logout();
          close();
        }}
        onDeleteAccount={async (password) => {
          await deleteAccount(password);
          close();
        }}
        onSaveServer={updateServerSettings}
        onUploadServerImage={uploadServerImage}
        onRegenerateInvite={regenerateServerInvite}
      />
    );
  }

  return null;
}

function AddFriendModal({
  onClose,
  onSend,
}: {
  onClose: () => void;
  onSend: (username: string) => Promise<void>;
}) {
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await onSend(username.trim());
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Hata");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="Arkadaş Ekle" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <p className="text-sm text-hiqu-muted">Kullanıcı adını girerek arkadaşlık isteği gönder.</p>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="kullaniciadi"
          className="w-full rounded-lg bg-hiqu-elevated px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-hiqu-accent"
        />
        {error && <p className="text-sm text-hiqu-dnd">{error}</p>}
        <button
          type="submit"
          disabled={loading || !username.trim()}
          className="w-full rounded-lg bg-hiqu-accent py-2.5 text-sm font-semibold text-white hover:bg-hiqu-accent-hover disabled:opacity-50"
        >
          İstek Gönder
        </button>
      </form>
    </Modal>
  );
}

function CreateServerModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (name: string) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await onCreate(name.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Hata");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="Sunucu Oluştur" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Sunucu adı"
          className="w-full rounded-lg bg-hiqu-elevated px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-hiqu-accent"
        />
        {error && <p className="text-sm text-hiqu-dnd">{error}</p>}
        <button
          type="submit"
          disabled={loading || name.trim().length < 2}
          className="w-full rounded-lg bg-hiqu-accent py-2.5 text-sm font-semibold text-white hover:bg-hiqu-accent-hover disabled:opacity-50"
        >
          Oluştur
        </button>
      </form>
    </Modal>
  );
}

function JoinServerModal({
  onClose,
  onJoin,
}: {
  onClose: () => void;
  onJoin: (code: string) => Promise<void>;
}) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await onJoin(code.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Hata");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="Sunucuya Katıl" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <p className="text-sm text-hiqu-muted">Davet kodunu girerek bir sunucuya katıl.</p>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="DAVETKODU"
          className="w-full rounded-lg bg-hiqu-elevated px-3 py-2.5 text-sm uppercase outline-none focus:ring-2 focus:ring-hiqu-accent"
        />
        {error && <p className="text-sm text-hiqu-dnd">{error}</p>}
        <button
          type="submit"
          disabled={loading || !code.trim()}
          className="w-full rounded-lg bg-hiqu-accent py-2.5 text-sm font-semibold text-white hover:bg-hiqu-accent-hover disabled:opacity-50"
        >
          Katıl
        </button>
      </form>
    </Modal>
  );
}

function CreateChannelModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (name: string) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await onCreate(name.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Hata");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="Kanal Oluştur" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="kanal-adi"
          className="w-full rounded-lg bg-hiqu-elevated px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-hiqu-accent"
        />
        {error && <p className="text-sm text-hiqu-dnd">{error}</p>}
        <button
          type="submit"
          disabled={loading || name.trim().length < 2}
          className="w-full rounded-lg bg-hiqu-accent py-2.5 text-sm font-semibold text-white hover:bg-hiqu-accent-hover disabled:opacity-50"
        >
          Oluştur
        </button>
      </form>
    </Modal>
  );
}

function NewGroupDmModal({
  friends,
  currentUserId,
  onClose,
  onCreate,
}: {
  friends: { id: string; name: string; avatar: string; username: string }[];
  currentUserId: string;
  onClose: () => void;
  onCreate: (memberIds: string[], name?: string) => Promise<void>;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const toggle = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selected.length === 0) {
      setError("En az bir arkadaş seçin");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await onCreate(selected, name.trim() || undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Hata");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="Grup DM Oluştur" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <p className="text-sm text-hiqu-muted">Arkadaşlarını seçerek grup sohbeti başlat.</p>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Grup adı (isteğe bağlı)"
          className="w-full rounded-lg bg-hiqu-elevated px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-hiqu-accent"
        />
        {friends.length === 0 ? (
          <p className="text-sm text-hiqu-muted">Grup oluşturmak için önce arkadaş ekleyin.</p>
        ) : (
          <div className="max-h-64 space-y-1 overflow-y-auto">
            {friends
              .filter((f) => f.id !== currentUserId)
              .map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => toggle(f.id)}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left ${
                    selected.includes(f.id) ? "bg-hiqu-accent/20 ring-1 ring-hiqu-accent" : "hover:bg-hiqu-elevated"
                  }`}
                >
                  <img src={f.avatar} alt="" className="size-8 rounded-full" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{f.name}</p>
                    <p className="text-xs text-hiqu-muted">@{f.username}</p>
                  </div>
                  {selected.includes(f.id) && <Check className="size-4 text-hiqu-accent" />}
                </button>
              ))}
          </div>
        )}
        {error && <p className="text-sm text-hiqu-dnd">{error}</p>}
        <button
          type="submit"
          disabled={loading || selected.length === 0}
          className="w-full rounded-lg bg-hiqu-accent py-2.5 text-sm font-semibold text-white hover:bg-hiqu-accent-hover disabled:opacity-50"
        >
          Grup Oluştur
        </button>
      </form>
    </Modal>
  );
}

function NewDmModal({
  friends,
  onClose,
  onSelect,
}: {
  friends: { id: string; name: string; avatar: string; username: string }[];
  onClose: () => void;
  onSelect: (id: string) => void;
}) {
  return (
    <Modal title="Mesaj Başlat" onClose={onClose}>
      {friends.length === 0 ? (
        <p className="text-sm text-hiqu-muted">Mesaj göndermek için önce arkadaş ekleyin.</p>
      ) : (
        <div className="max-h-64 space-y-1 overflow-y-auto">
          {friends.map((f) => (
            <button
              key={f.id}
              onClick={() => onSelect(f.id)}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-hiqu-elevated"
            >
              <img src={f.avatar} alt="" className="size-8 rounded-full" />
              <div>
                <p className="text-sm font-medium">{f.name}</p>
                <p className="text-xs text-hiqu-muted">@{f.username}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </Modal>
  );
}
