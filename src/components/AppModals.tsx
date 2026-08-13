import { useState } from "react";
import type { Status } from "../types";
import { useApp } from "../context/AppContext";
import { Modal } from "./Modal";

export function AppModals() {
  const {
    activeModal,
    setActiveModal,
    sendFriendRequest,
    createServer,
    joinServer,
    createChannel,
    updateProfile,
    currentUser,
    friends,
    openDm,
    openServer,
    activeServerId,
    servers,
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
  if (activeModal === "settings" && currentUser) {
    return (
      <SettingsModal
        user={currentUser}
        onClose={close}
        onSave={updateProfile}
        inviteCode={
          activeServerId !== "home"
            ? servers.find((s) => s.id === activeServerId)?.inviteCode
            : undefined
        }
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

function SettingsModal({
  user,
  onClose,
  onSave,
  inviteCode,
}: {
  user: { name: string; statusText?: string; status: Status };
  onClose: () => void;
  onSave: (data: { statusText?: string; status?: Status; name?: string }) => Promise<void>;
  inviteCode?: string;
}) {
  const [name, setName] = useState(user.name);
  const [statusText, setStatusText] = useState(user.statusText ?? "");
  const [status, setStatus] = useState<Status>(user.status);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await onSave({ name, statusText, status });
    setLoading(false);
    onClose();
  };

  return (
    <Modal title="Ayarlar" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="mb-1 block text-xs text-hiqu-muted">Görünen ad</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg bg-hiqu-elevated px-3 py-2 text-sm outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-hiqu-muted">Durum mesajı</label>
          <input
            value={statusText}
            onChange={(e) => setStatusText(e.target.value)}
            className="w-full rounded-lg bg-hiqu-elevated px-3 py-2 text-sm outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-hiqu-muted">Durum</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as Status)}
            className="w-full rounded-lg bg-hiqu-elevated px-3 py-2 text-sm outline-none"
          >
            <option value="online">Çevrimiçi</option>
            <option value="idle">Boşta</option>
            <option value="dnd">Rahatsız Etmeyin</option>
          </select>
        </div>
        {inviteCode && (
          <div className="rounded-lg bg-hiqu-elevated p-3">
            <p className="text-xs text-hiqu-muted">Sunucu davet kodu</p>
            <p className="font-mono text-lg font-bold tracking-widest">{inviteCode}</p>
          </div>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-hiqu-accent py-2.5 text-sm font-semibold text-white hover:bg-hiqu-accent-hover"
        >
          Kaydet
        </button>
      </form>
    </Modal>
  );
}
