import { useEffect, useRef, useState } from "react";
import { Hash, Smile } from "lucide-react";
import type { Message, User } from "../types";
import { Avatar } from "./Avatar";

interface ChatViewProps {
  title: string;
  subtitle?: string;
  avatar?: string;
  status?: User["status"];
  messages: Message[];
  authorMap: Record<string, User>;
  placeholder: string;
  onSend: (content: string) => void;
  emptyMessage?: string;
}

export function ChatView({
  title,
  subtitle,
  avatar,
  status,
  messages,
  authorMap,
  placeholder,
  onSend,
  emptyMessage,
}: ChatViewProps) {
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    onSend(input);
    setInput("");
  };

  return (
    <div className="flex flex-1 flex-col bg-hiqu-bg">
      <header className="flex h-12 shrink-0 items-center gap-3 border-b border-hiqu-border px-4 shadow-sm">
        {avatar ? (
          <Avatar src={avatar} alt={title} size="sm" status={status} />
        ) : (
          <Hash className="size-5 text-hiqu-muted" />
        )}
        <div>
          <span className="font-semibold">{title}</span>
          {subtitle && <p className="text-xs text-hiqu-muted">{subtitle}</p>}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center text-hiqu-muted">
            {avatar && <Avatar src={avatar} alt={title} size="lg" status={status} />}
            {!avatar && (
              <div className="flex size-16 items-center justify-center rounded-full bg-hiqu-panel text-3xl">
                #
              </div>
            )}
            <p className="mt-4 text-lg font-semibold text-hiqu-text">{title}</p>
            <p className="text-sm">{emptyMessage ?? "Sohbetin başlangıcı."}</p>
          </div>
        )}

        {messages.map((msg) => {
          const isMe = msg.authorId === "me";
          const author = isMe ? null : authorMap[msg.authorId];

          return (
            <div
              key={msg.id}
              className="group -mx-2 mb-4 flex gap-4 rounded px-2 py-1 hover:bg-hiqu-panel/30"
            >
              {!isMe && author ? (
                <Avatar src={author.avatar} alt={author.name} size="md" status={author.status} />
              ) : (
                <div className="size-10 shrink-0" />
              )}
              <div className="min-w-0 flex-1">
                <div className="mb-0.5 flex items-baseline gap-2">
                  <span className={`font-semibold ${isMe ? "" : "text-hiqu-accent"}`}>
                    {isMe ? "Sen" : author?.name ?? "Bilinmeyen"}
                  </span>
                  <span className="text-xs text-hiqu-muted">{msg.timestamp}</span>
                </div>
                {msg.embed?.type === "youtube" && (
                  <div className="mb-2 max-w-md overflow-hidden rounded-lg border-l-4 border-red-600 bg-hiqu-panel">
                    <a
                      href={msg.embed.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block p-3 text-sm text-blue-400 hover:underline"
                    >
                      {msg.embed.title}
                    </a>
                    {msg.embed.thumbnail && (
                      <img src={msg.embed.thumbnail} alt="" className="w-full object-cover" />
                    )}
                  </div>
                )}
                <p className="text-[15px] leading-relaxed text-hiqu-text/90">{msg.content}</p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form className="shrink-0 px-4 pb-6" onSubmit={handleSubmit}>
        <div className="flex items-center gap-2 rounded-lg bg-hiqu-panel px-4 py-2.5">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={placeholder}
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-hiqu-muted"
          />
          <Smile className="size-5 text-hiqu-muted" />
        </div>
      </form>
    </div>
  );
}
