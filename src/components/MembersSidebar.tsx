import type { User } from "../types";
import { Avatar } from "./Avatar";

interface MembersSidebarProps {
  members: User[];
  title?: string;
}

export function MembersSidebar({ members, title = "Üyeler" }: MembersSidebarProps) {
  const online = members.filter((m) => m.status === "online" || m.status === "idle");
  const offline = members.filter((m) => m.status === "offline" || m.status === "dnd");

  return (
    <aside className="flex w-60 shrink-0 flex-col bg-hiqu-panel">
      <header className="flex h-12 shrink-0 items-center border-b border-hiqu-border px-4">
        <span className="font-semibold">{title}</span>
      </header>
      <div className="flex-1 overflow-y-auto p-3">
        {online.length > 0 && (
          <>
            <p className="mb-2 text-xs font-semibold uppercase text-hiqu-muted">
              Çevrimiçi — {online.length}
            </p>
            {online.map((m) => (
              <MemberRow key={m.id} user={m} />
            ))}
          </>
        )}
        {offline.length > 0 && (
          <>
            <p className="mb-2 mt-4 text-xs font-semibold uppercase text-hiqu-muted">
              Çevrimdışı — {offline.length}
            </p>
            {offline.map((m) => (
              <MemberRow key={m.id} user={m} />
            ))}
          </>
        )}
        {members.length === 0 && (
          <p className="text-center text-sm text-hiqu-muted">Üye yok.</p>
        )}
      </div>
    </aside>
  );
}

function MemberRow({ user }: { user: User }) {
  return (
    <div className="mb-1 flex items-center gap-2 rounded px-2 py-1.5 hover:bg-hiqu-elevated">
      <Avatar src={user.avatar} alt={user.name} size="sm" status={user.status} />
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{user.name}</p>
        {user.statusText && (
          <p className="truncate text-xs text-hiqu-muted">{user.statusText}</p>
        )}
      </div>
    </div>
  );
}
