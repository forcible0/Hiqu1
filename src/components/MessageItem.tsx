import {
  Copy,
  Forward,
  MoreHorizontal,
  Pin,
  Reply,
  SmilePlus,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Message, User } from "../types";
import { Avatar } from "./Avatar";
import { EmojiGifPicker } from "./EmojiGifPicker";

interface MessageItemProps {
  msg: Message;
  compact: boolean;
  isMe: boolean;
  author?: User;
  authorMap: Record<string, User>;
  currentUserId: string;
  highlighted: boolean;
  isFirst: boolean;
  highlightContent: (content: string) => React.ReactNode;
  onReply: (msg: Message) => void;
  onPin: (msg: Message) => void;
  onReact: (msg: Message, emoji: string) => void;
  onForward: (msg: Message) => void;
  onJumpToReply?: (messageId: string) => void;
}

export function MessageItem({
  msg,
  compact,
  isMe,
  author,
  authorMap,
  currentUserId,
  highlighted,
  isFirst,
  highlightContent,
  onReply,
  onPin,
  onReact,
  onForward,
  onJumpToReply,
}: MessageItemProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [reactionPickerOpen, setReactionPickerOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const reactionAnchorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [menuOpen]);

  const copyText = async () => {
    await navigator.clipboard.writeText(msg.content);
    setMenuOpen(false);
  };

  const handlePin = () => {
    onPin(msg);
    setMenuOpen(false);
  };

  const handleEmojiSelect = (emoji: string) => {
    onReact(msg, emoji);
    setReactionPickerOpen(false);
  };

  const reactionNames = (userIds: string[]) =>
    userIds
      .map((id) => {
        if (id === "me" || id === currentUserId) return "Sen";
        return authorMap[id]?.name ?? "Bilinmeyen";
      })
      .join(", ");

  return (
    <div
      className={`group/msg relative -mx-2 px-2 ${
        highlighted ? "hiqu-msg-reply-highlight" : "hover:bg-[var(--color-hiqu-message-hover)]"
      } ${compact ? "py-[1px]" : isFirst ? "pb-[1px] pt-2" : "mt-[1.0625rem] pb-[1px]"}`}
    >
      {compact && (
        <span className="pointer-events-none absolute -left-1 top-1/2 hidden -translate-y-1/2 text-[10px] leading-none text-hiqu-muted group-hover/msg:block">
          {msg.timestamp}
        </span>
      )}

      <div
        className={`absolute -top-3 right-2 z-10 hidden items-center gap-0.5 rounded-md border border-hiqu-border/60 bg-hiqu-elevated p-0.5 shadow-lg group-hover/msg:flex ${
          menuOpen || reactionPickerOpen ? "!flex" : ""
        }`}
      >
        <div ref={reactionAnchorRef} className="relative">
          <EmojiGifPicker
            open={reactionPickerOpen}
            tab="emoji"
            emojiOnly
            anchorRef={reactionAnchorRef}
            onTabChange={() => undefined}
            onClose={() => setReactionPickerOpen(false)}
            onEmojiSelect={handleEmojiSelect}
            onGifSelect={() => undefined}
          />
          <ToolbarBtn
            title="İfade ekle"
            onClick={() => setReactionPickerOpen((v) => !v)}
            active={reactionPickerOpen}
          >
            <SmilePlus className="size-4" />
          </ToolbarBtn>
        </div>
        <ToolbarBtn title="Yanıtla" onClick={() => onReply(msg)}>
          <Reply className="size-4" />
        </ToolbarBtn>
        <ToolbarBtn title="İlet" onClick={() => onForward(msg)}>
          <Forward className="size-4" />
        </ToolbarBtn>
        <div ref={menuRef} className="relative">
          <ToolbarBtn title="Daha fazla" onClick={() => setMenuOpen((v) => !v)}>
            <MoreHorizontal className="size-4" />
          </ToolbarBtn>
          {menuOpen && (
            <div className="absolute bottom-full right-0 z-20 mb-1 min-w-[160px] overflow-hidden rounded-md border border-hiqu-border/60 bg-hiqu-elevated py-1 shadow-xl">
              <MenuRow icon={Copy} onClick={copyText}>
                Metni Kopyala
              </MenuRow>
              <MenuRow icon={Pin} onClick={handlePin}>
                Mesajı Sabitle
              </MenuRow>
            </div>
          )}
        </div>
      </div>

      <div className={`flex ${compact ? "pl-[56px]" : "gap-4"}`}>
        {!compact &&
          (author ? (
            <Avatar src={author.avatar} alt={author.name} size="md" status={author.status} className="mt-0.5" />
          ) : (
            <div className="w-10 shrink-0" />
          ))}

        <div className="min-w-0 flex-1">
          {!compact && (
            <div className="flex h-[1.375rem] items-baseline gap-2 leading-[1.375rem]">
              <span className={`text-base font-medium ${isMe ? "text-hiqu-text" : "text-hiqu-accent"}`}>
                {author?.name ?? (isMe ? "Sen" : "Bilinmeyen")}
              </span>
              <span className="text-xs text-hiqu-muted opacity-0 transition-opacity group-hover/msg:opacity-100">
                {msg.timestamp}
              </span>
            </div>
          )}

          {msg.replyTo && (
            <button
              type="button"
              onClick={() => onJumpToReply?.(msg.replyTo!.id)}
              className="mb-1 flex max-w-md items-start gap-2 rounded-sm border-l-2 border-hiqu-accent pl-2 text-left text-xs text-hiqu-muted hover:text-hiqu-text"
            >
              <Reply className="mt-0.5 size-3 shrink-0 text-hiqu-accent" />
              <span className="min-w-0">
                <span className="font-semibold text-hiqu-accent">{msg.replyTo.authorName}</span>
                <span className="ml-1 truncate">{msg.replyTo.content}</span>
              </span>
            </button>
          )}

          {msg.embed?.type === "youtube" && (
            <div className="mb-1 max-w-md overflow-hidden rounded-lg border-l-4 border-red-600 bg-hiqu-panel">
              <a
                href={msg.embed.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-3 text-sm text-blue-400 hover:underline"
              >
                {msg.embed.title}
              </a>
              {msg.embed.thumbnail && <img src={msg.embed.thumbnail} alt="" className="w-full object-cover" />}
            </div>
          )}

          {msg.embed?.type === "gif" && msg.embed.url && (
            <img src={msg.embed.url} alt="GIF" className="mb-1 max-h-64 max-w-sm rounded-lg object-contain" />
          )}

          {msg.content && !(msg.embed?.type === "gif" && msg.content === msg.embed.url) && (
            <div className="whitespace-pre-wrap text-base leading-[1.375rem] text-hiqu-text">
              {highlightContent(msg.content)}
            </div>
          )}

          {msg.reactions && msg.reactions.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1">
              {msg.reactions.map((reaction) => {
                const mine = reaction.userIds.includes("me") || reaction.userIds.includes(currentUserId);
                return (
                  <button
                    key={reaction.emoji}
                    type="button"
                    title={reactionNames(reaction.userIds)}
                    onClick={() => onReact(msg, reaction.emoji)}
                    className={`inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-xs transition-colors ${
                      mine
                        ? "border-hiqu-accent/60 bg-hiqu-accent/15 text-hiqu-text"
                        : "border-hiqu-border/60 bg-hiqu-elevated/80 text-hiqu-muted hover:border-hiqu-border hover:text-hiqu-text"
                    }`}
                  >
                    <span>{reaction.emoji}</span>
                    <span className="font-medium">{reaction.userIds.length}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ToolbarBtn({
  children,
  title,
  onClick,
  active,
}: {
  children: React.ReactNode;
  title: string;
  onClick?: () => void;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`flex size-7 items-center justify-center rounded transition-colors ${
        active
          ? "bg-hiqu-accent/20 text-hiqu-text"
          : "text-hiqu-icon-muted hover:bg-hiqu-hover hover:text-hiqu-text"
      }`}
    >
      {children}
    </button>
  );
}

function MenuRow({
  icon: Icon,
  children,
  onClick,
}: {
  icon: typeof Copy;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-hiqu-text hover:bg-hiqu-hover"
    >
      <Icon className="size-4 text-hiqu-icon-muted" />
      {children}
    </button>
  );
}
