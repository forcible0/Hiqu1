import { Pin, X } from "lucide-react";
import type { Message, User } from "../types";
import { Avatar } from "./Avatar";

interface PinnedMessagesModalProps {
  open: boolean;
  messages: Message[];
  authorMap: Record<string, User>;
  currentUser: User;
  onClose: () => void;
  onUnpin: (messageId: string) => void;
  onJump: (messageId: string) => void;
}

export function PinnedMessagesModal({
  open,
  messages,
  authorMap,
  currentUser,
  onClose,
  onUnpin,
  onJump,
}: PinnedMessagesModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        className="flex max-h-[70vh] w-full max-w-md flex-col overflow-hidden rounded-xl border border-hiqu-border/60 bg-hiqu-panel shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-hiqu-border/60 px-4 py-3">
          <div className="flex items-center gap-2">
            <Pin className="size-4 text-hiqu-icon-muted" />
            <h2 className="font-semibold">Sabitlenen Mesajlar</h2>
          </div>
          <button type="button" onClick={onClose} className="text-hiqu-muted hover:text-hiqu-text">
            <X className="size-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {messages.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-hiqu-muted">Henüz sabitlenmiş mesaj yok.</p>
          ) : (
            messages.map((msg) => {
              const isMe = msg.authorId === "me" || msg.authorId === currentUser.id;
              const author = isMe ? currentUser : authorMap[msg.authorId];
              return (
                <div
                  key={msg.id}
                  className="mb-1 rounded-lg border border-transparent p-2 hover:border-hiqu-border/40 hover:bg-hiqu-hover/40"
                >
                  <div className="mb-1 flex items-center gap-2">
                    {author && <Avatar src={author.avatar} alt={author.name} size="sm" />}
                    <span className="text-sm font-medium">{author?.name ?? "Bilinmeyen"}</span>
                    <span className="text-xs text-hiqu-muted">{msg.timestamp}</span>
                    <button
                      type="button"
                      onClick={() => onUnpin(msg.id)}
                      className="ml-auto text-xs text-hiqu-muted hover:text-hiqu-dnd"
                    >
                      Kaldır
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onJump(msg.id);
                      onClose();
                    }}
                    className="block w-full truncate text-left text-sm text-hiqu-text hover:underline"
                  >
                    {msg.content || "Embed"}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
