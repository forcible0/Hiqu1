import { Compass, Plus } from "lucide-react";
import type { Server } from "../types";

interface ServerSidebarProps {
  servers: Server[];
  activeId: string;
  onSelectHome: () => void;
  onSelectServer: (id: string) => void;
  onCreateServer: () => void;
  onJoinServer: () => void;
}

export function ServerSidebar({
  servers,
  activeId,
  onSelectHome,
  onSelectServer,
  onCreateServer,
  onJoinServer,
}: ServerSidebarProps) {
  return (
    <aside className="flex w-[72px] shrink-0 flex-col items-center gap-2 bg-hiqu-surface py-3">
      <button
        onClick={onSelectHome}
        className="group relative flex size-12 items-center justify-center"
        title="Ana Sayfa"
      >
        <span
          className={`absolute -left-3 w-1 rounded-r-full bg-white transition-all ${
            activeId === "home" ? "h-10" : "h-0 group-hover:h-5"
          }`}
        />
        <span
          className={`flex size-12 items-center justify-center rounded-2xl text-xl transition-all ${
            activeId === "home"
              ? "rounded-xl bg-hiqu-accent"
              : "bg-hiqu-elevated hover:rounded-xl hover:bg-hiqu-accent"
          }`}
        >
          🌙
        </span>
      </button>

      <div className="my-1 h-0.5 w-8 rounded-full bg-hiqu-border" />

      {servers.map((server) => (
        <button
          key={server.id}
          onClick={() => onSelectServer(server.id)}
          className="group relative flex size-12 items-center justify-center"
          title={server.name}
        >
          <span
            className={`absolute -left-3 w-1 rounded-r-full bg-white transition-all ${
              activeId === server.id ? "h-10" : "h-0 group-hover:h-5"
            }`}
          />
          <span
            className={`flex size-12 items-center justify-center overflow-hidden rounded-2xl transition-all ${
              activeId === server.id
                ? "rounded-xl bg-hiqu-accent"
                : "bg-hiqu-elevated hover:rounded-xl hover:bg-hiqu-accent"
            }`}
          >
            <img src={server.icon} alt={server.name} className="size-full object-cover" />
          </span>
        </button>
      ))}

      <div className="my-1 h-0.5 w-8 rounded-full bg-hiqu-border" />

      <button
        onClick={onCreateServer}
        title="Sunucu Oluştur"
        className="flex size-12 items-center justify-center rounded-2xl bg-hiqu-elevated text-hiqu-online transition-all hover:rounded-xl hover:bg-hiqu-online hover:text-white"
      >
        <Plus className="size-6" />
      </button>
      <button
        onClick={onJoinServer}
        title="Sunucuya Katıl"
        className="flex size-12 items-center justify-center rounded-2xl bg-hiqu-elevated text-hiqu-online transition-all hover:rounded-xl hover:bg-hiqu-online hover:text-white"
      >
        <Compass className="size-5" />
      </button>
    </aside>
  );
}
