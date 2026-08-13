import { Forward, Hash, X } from "lucide-react";
import type { ForwardDestination } from "../types";
import { Avatar } from "./Avatar";

interface ForwardMessageModalProps {
  open: boolean;
  preview: string;
  destinations: ForwardDestination[];
  onClose: () => void;
  onSelect: (dest: ForwardDestination) => void;
}

export function ForwardMessageModal({
  open,
  preview,
  destinations,
  onClose,
  onSelect,
}: ForwardMessageModalProps) {
  if (!open) return null;

  const dms = destinations.filter((d) => d.type === "dm");
  const groups = destinations.filter((d) => d.type === "group");
  const channels = destinations.filter((d) => d.type === "channel");

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        className="flex max-h-[70vh] w-full max-w-md flex-col overflow-hidden rounded-xl border border-hiqu-border/60 bg-hiqu-panel shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-hiqu-border/60 px-4 py-3">
          <div className="flex items-center gap-2">
            <Forward className="size-4 text-hiqu-icon-muted" />
            <h2 className="font-semibold">Mesajı İlet</h2>
          </div>
          <button type="button" onClick={onClose} className="text-hiqu-muted hover:text-hiqu-text">
            <X className="size-5" />
          </button>
        </div>

        <div className="border-b border-hiqu-border/60 px-4 py-2">
          <p className="truncate text-sm text-hiqu-muted">{preview}</p>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {destinations.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-hiqu-muted">İletilecek sohbet bulunamadı.</p>
          ) : (
            <>
              {dms.length > 0 && <Section title="Direkt Mesajlar">{dms.map(renderDest)}</Section>}
              {groups.length > 0 && <Section title="Gruplar">{groups.map(renderDest)}</Section>}
              {channels.length > 0 && <Section title="Kanallar">{channels.map(renderDest)}</Section>}
            </>
          )}
        </div>
      </div>
    </div>
  );

  function renderDest(dest: ForwardDestination) {
    return (
      <button
        key={`${dest.type}-${dest.id}`}
        type="button"
        onClick={() => {
          onSelect(dest);
          onClose();
        }}
        className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-hiqu-hover"
      >
        {dest.type === "channel" ? (
          <div className="flex size-8 items-center justify-center rounded-full bg-hiqu-elevated text-hiqu-muted">
            <Hash className="size-4" />
          </div>
        ) : (
          <Avatar src={dest.avatar ?? ""} alt={dest.name} size="sm" />
        )}
        <span className="truncate text-sm font-medium text-hiqu-text">{dest.name}</span>
      </button>
    );
  }
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-2">
      <p className="px-3 py-1 text-xs font-semibold uppercase tracking-wide text-hiqu-muted">{title}</p>
      {children}
    </div>
  );
}
