import { Check, MessageSquare, X } from "lucide-react";
import type { MessageRequest } from "../types";
import { Avatar } from "./Avatar";

interface MessageRequestsViewProps {
  requests: MessageRequest[];
  onAccept: (requestId: string) => void;
  onDecline: (requestId: string) => void;
}

export function MessageRequestsView({ requests, onAccept, onDecline }: MessageRequestsViewProps) {
  return (
    <div className="hiqu-main flex flex-1 flex-col">
      <header className="flex h-12 shrink-0 items-center gap-4 border-b border-hiqu-border/60 px-4 shadow-sm">
        <MessageSquare className="size-5 text-hiqu-muted" />
        <span className="font-semibold">Mesaj İstekleri</span>
        {requests.length > 0 && (
          <span className="rounded-full bg-hiqu-dnd px-2 py-0.5 text-xs text-white">
            {requests.length}
          </span>
        )}
      </header>

      <div className="flex-1 overflow-y-auto p-4">
        {requests.length === 0 ? (
          <div className="mt-12 text-center text-hiqu-muted">
            <MessageSquare className="mx-auto mb-3 size-12 opacity-40" />
            <p className="font-medium text-hiqu-text">Mesaj isteği yok</p>
            <p className="mt-1 text-sm">Arkadaş olmadığınız kişilerden gelen mesajlar burada görünür.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {requests.map((request) => (
              <div
                key={request.id}
                className="rounded-lg border border-hiqu-border/40 bg-hiqu-panel/50 p-4"
              >
                <div className="flex items-start gap-3">
                  <Avatar src={request.from.avatar} alt={request.from.name} size="md" />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{request.from.name}</p>
                    <p className="text-sm text-hiqu-muted">@{request.from.username}</p>
                    <p className="mt-2 rounded-md bg-hiqu-elevated px-3 py-2 text-sm text-hiqu-text">
                      {request.content}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex justify-end gap-2">
                  <button
                    onClick={() => onDecline(request.id)}
                    className="flex items-center gap-1.5 rounded-md bg-hiqu-elevated px-3 py-1.5 text-sm text-hiqu-muted hover:text-hiqu-dnd"
                  >
                    <X className="size-4" />
                    Reddet
                  </button>
                  <button
                    onClick={() => onAccept(request.id)}
                    className="flex items-center gap-1.5 rounded-md bg-hiqu-accent px-3 py-1.5 text-sm font-medium text-white hover:bg-hiqu-accent-hover"
                  >
                    <Check className="size-4" />
                    Kabul Et
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
