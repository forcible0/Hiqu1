import { useState } from "react";

interface AuthScreenProps {
  onLogin: (login: string, password: string, remember: boolean) => Promise<void>;
  onRegister: (data: {
    email: string;
    username: string;
    password: string;
    displayName: string;
  }) => Promise<void>;
}

const REMEMBER_KEY = "hiqu_remember_me";

export function AuthScreen({ onLogin, onRegister }: AuthScreenProps) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loginValue, setLoginValue] = useState("");
  const [rememberMe, setRememberMe] = useState(() => localStorage.getItem(REMEMBER_KEY) !== "0");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await onLogin(loginValue.trim(), password, rememberMe);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Giriş başarısız");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await onRegister({
        email: email.trim(),
        username: username.trim(),
        password,
        displayName: displayName.trim(),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kayıt başarısız");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-full items-center justify-center bg-hiqu-bg p-4">
      <div className="w-full max-w-md rounded-2xl bg-hiqu-panel p-8 shadow-2xl">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl bg-hiqu-accent text-3xl">
            🌙
          </div>
          <h1 className="text-2xl font-bold">Hiqu</h1>
          <p className="mt-1 text-sm text-hiqu-muted">
            {mode === "login" ? "Hesabına giriş yap" : "Yeni hesap oluştur"}
          </p>
        </div>

        <div className="mb-6 flex rounded-lg bg-hiqu-elevated p-1">
          <button
            type="button"
            onClick={() => { setMode("login"); setError(""); }}
            className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
              mode === "login" ? "bg-hiqu-accent text-white" : "text-hiqu-muted hover:text-hiqu-text"
            }`}
          >
            Giriş Yap
          </button>
          <button
            type="button"
            onClick={() => { setMode("register"); setError(""); }}
            className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
              mode === "register" ? "bg-hiqu-accent text-white" : "text-hiqu-muted hover:text-hiqu-text"
            }`}
          >
            Kayıt Ol
          </button>
        </div>

        {mode === "login" ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <Field
              label="Kullanıcı adı veya e-posta"
              value={loginValue}
              onChange={setLoginValue}
              placeholder="kullaniciadi"
            />
            <Field
              label="Şifre"
              type="password"
              value={password}
              onChange={setPassword}
              placeholder="••••••••"
            />
            <label className="flex cursor-pointer items-center gap-2 text-sm text-hiqu-muted">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="size-4 rounded accent-hiqu-accent"
              />
              Beni hatırla
            </label>
            {error && <ErrorMsg>{error}</ErrorMsg>}
            <SubmitBtn loading={loading} label="Giriş Yap" />
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-4">
            <Field label="E-posta" type="email" value={email} onChange={setEmail} placeholder="ornek@mail.com" />
            <Field label="Kullanıcı adı" value={username} onChange={setUsername} placeholder="kullaniciadi" />
            <Field label="Görünen ad" value={displayName} onChange={setDisplayName} placeholder="Adın" />
            <Field label="Şifre" type="password" value={password} onChange={setPassword} placeholder="En az 6 karakter" />
            {error && <ErrorMsg>{error}</ErrorMsg>}
            <SubmitBtn loading={loading} label="Kayıt Ol" />
          </form>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-hiqu-muted">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg bg-hiqu-elevated px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-hiqu-accent"
      />
    </div>
  );
}

function ErrorMsg({ children }: { children: string }) {
  return <p className="text-sm text-hiqu-dnd">{children}</p>;
}

function SubmitBtn({ loading, label }: { loading: boolean; label: string }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="w-full rounded-lg bg-hiqu-accent py-2.5 text-sm font-semibold text-white transition-colors hover:bg-hiqu-accent-hover disabled:opacity-50"
    >
      {loading ? "Bekleyin..." : label}
    </button>
  );
}
