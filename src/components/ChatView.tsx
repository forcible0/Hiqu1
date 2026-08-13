import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Hash, PanelRightOpen, Pin, Search, Smile, X } from "lucide-react";
import type { ForwardDestination, Message, User } from "../types";
import { Avatar } from "./Avatar";
import { EmojiGifPicker } from "./EmojiGifPicker";
import { ForwardMessageModal } from "./ForwardMessageModal";
import { MessageItem } from "./MessageItem";
import { PinnedMessagesModal } from "./PinnedMessagesModal";
import { buildForwardContent, buildReplyHighlightSet, enrichMessageReply } from "../lib/message-utils";

interface ChatViewProps {
  chatId: string;
  title: string;
  subtitle?: string;
  avatar?: string;
  status?: User["status"];
  currentUser: User;
  messages: Message[];
  authorMap: Record<string, User>;
  placeholder: string;
  onSend: (content: string, replyToId?: string) => void;
  emptyMessage?: string;
  searchQuery?: string;
  showProfileToggle?: boolean;
  onShowProfile?: () => void;
  showHeaderActions?: boolean;
  onSearchClick?: () => void;
  headerSearchActive?: boolean;
  pinnedIds?: string[];
  onPin: (messageId: string) => Promise<void>;
  onUnpin: (messageId: string) => Promise<void>;
  onReact: (messageId: string, emoji: string) => void;
  forwardDestinations: ForwardDestination[];
  onForward: (content: string, dest: ForwardDestination) => void;
}

export function ChatView({
  chatId,
  title,
  subtitle,
  avatar,
  status,
  currentUser,
  messages,
  authorMap,
  placeholder,
  onSend,
  emptyMessage,
  searchQuery = "",
  showProfileToggle,
  onShowProfile,
  showHeaderActions = true,
  onSearchClick,
  headerSearchActive,
  pinnedIds = [],
  onPin,
  onUnpin,
  onReact,
  forwardDestinations,
  onForward,
}: ChatViewProps) {
  const [input, setInput] = useState("");
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerTab, setPickerTab] = useState<"emoji" | "gif">("emoji");
  const [pinnedOpen, setPinnedOpen] = useState(false);
  const [forwardMsg, setForwardMsg] = useState<Message | null>(null);
  const [inlineSearchOpen, setInlineSearchOpen] = useState(false);
  const [inlineSearch, setInlineSearch] = useState("");
  const pickerAnchorRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const firstMatchRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const messageRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const stickToBottomRef = useRef(true);

  const effectiveSearch = searchQuery || (inlineSearchOpen ? inlineSearch : "");
  const query = effectiveSearch.trim().toLowerCase();
  const lastMessageId = messages[messages.length - 1]?.id ?? null;

  const enrichedMessages = useMemo(() => {
    let list = messages;
    for (let i = 0; i < list.length; i++) {
      const m = list[i]!;
      if (m.replyToId && !m.replyTo) {
        list = [...list];
        list[i] = enrichMessageReply(m, list, authorMap, currentUser);
      }
    }
    return list;
  }, [messages, authorMap, currentUser]);

  const visibleMessages = useMemo(() => {
    if (!query) return enrichedMessages;
    return enrichedMessages.filter((m) => m.content.toLowerCase().includes(query));
  }, [enrichedMessages, query]);

  const replyHighlightSet = useMemo(() => buildReplyHighlightSet(enrichedMessages), [enrichedMessages]);

  const pinnedMessages = useMemo(
    () => pinnedIds.map((id) => enrichedMessages.find((m) => m.id === id)).filter(Boolean) as Message[],
    [pinnedIds, enrichedMessages],
  );

  const scrollToBottom = useCallback(() => {
    const el = messagesRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, []);

  useLayoutEffect(() => {
    stickToBottomRef.current = true;
    setInlineSearchOpen(false);
    setInlineSearch("");
  }, [chatId]);

  useLayoutEffect(() => {
    if (query) {
      firstMatchRef.current?.scrollIntoView({ block: "center" });
      return;
    }
    if (stickToBottomRef.current) scrollToBottom();
  }, [chatId, lastMessageId, query, scrollToBottom]);

  useEffect(() => {
    if (query || !stickToBottomRef.current) return;
    const el = messagesRef.current;
    if (!el) return;

    const stick = () => {
      if (stickToBottomRef.current) scrollToBottom();
    };

    const ro = new ResizeObserver(stick);
    ro.observe(el);

    const onImageLoad = () => stick();
    const imgs = Array.from(el.querySelectorAll("img"));
    for (const img of imgs) {
      if (!img.complete) img.addEventListener("load", onImageLoad, { once: true });
    }

    stick();
    const timers = [50, 150, 400, 800].map((ms) => window.setTimeout(stick, ms));
    const stop = window.setTimeout(() => {
      stickToBottomRef.current = false;
    }, 900);

    return () => {
      ro.disconnect();
      for (const img of imgs) img.removeEventListener("load", onImageLoad);
      timers.forEach(clearTimeout);
      clearTimeout(stop);
    };
  }, [chatId, lastMessageId, query, scrollToBottom]);

  useEffect(() => {
    setPickerOpen(false);
    setInput("");
    setReplyTo(null);
    setForwardMsg(null);
  }, [chatId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    onSend(input, replyTo?.id);
    setInput("");
    setReplyTo(null);
    stickToBottomRef.current = true;
    requestAnimationFrame(scrollToBottom);
  };

  const handleEmoji = (emoji: string) => {
    setInput((prev) => prev + emoji);
    setPickerOpen(false);
    inputRef.current?.focus();
  };

  const handleGif = (url: string) => {
    onSend(url, replyTo?.id);
    setReplyTo(null);
    setPickerOpen(false);
  };

  const togglePicker = (tab: "emoji" | "gif") => {
    if (pickerOpen && pickerTab === tab) {
      setPickerOpen(false);
      return;
    }
    setPickerTab(tab);
    setPickerOpen(true);
  };

  const handlePin = async (msg: Message) => {
    await onPin(msg.id);
  };

  const handleUnpin = async (messageId: string) => {
    await onUnpin(messageId);
  };

  const jumpToMessage = (messageId: string) => {
    messageRefs.current[messageId]?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const handleSearchClick = () => {
    if (onSearchClick) {
      onSearchClick();
      return;
    }
    setInlineSearchOpen((v) => !v);
  };

  const handleForwardSelect = (dest: ForwardDestination) => {
    if (!forwardMsg) return;
    const authorName =
      forwardMsg.authorId === "me" || forwardMsg.authorId === currentUser.id
        ? currentUser.name
        : authorMap[forwardMsg.authorId]?.name ?? "Bilinmeyen";
    onForward(buildForwardContent(authorName, forwardMsg), dest);
    setForwardMsg(null);
  };

  function highlightContent(content: string) {
    if (!query) return content;
    const parts = content.split(new RegExp(`(${escapeRegExp(query)})`, "gi"));
    return parts.map((part, i) =>
      part.toLowerCase() === query ? (
        <mark key={i} className="rounded bg-yellow-500/30 text-hiqu-text">
          {part}
        </mark>
      ) : (
        part
      ),
    );
  }

  const searchActive = headerSearchActive || inlineSearchOpen;

  return (
    <div className="hiqu-main flex flex-1 flex-col">
      <header className="flex h-12 shrink-0 items-center gap-3 border-b border-hiqu-border/60 px-4 shadow-sm">
        {avatar ? (
          <Avatar src={avatar} alt={title} size="sm" status={status} />
        ) : (
          <Hash className="size-5 text-hiqu-muted" />
        )}
        <div className="min-w-0 flex-1">
          <span className="font-semibold">{title}</span>
          {subtitle && <p className="text-xs text-hiqu-muted">{subtitle}</p>}
        </div>

        <div className="flex items-center gap-1">
          {showHeaderActions && (
            <>
              <HeaderIconBtn
                title="Sabitlenen mesajlar"
                active={pinnedOpen}
                onClick={() => setPinnedOpen(true)}
              >
                <Pin className="size-[18px]" />
              </HeaderIconBtn>
              <HeaderIconBtn title="Mesajlarda ara" active={searchActive} onClick={handleSearchClick}>
                <Search className="size-[18px]" />
              </HeaderIconBtn>
            </>
          )}
          {showProfileToggle && onShowProfile && (
            <HeaderIconBtn title="Kullanıcı profilini göster" onClick={onShowProfile}>
              <PanelRightOpen className="size-[18px]" />
            </HeaderIconBtn>
          )}
        </div>
      </header>

      {inlineSearchOpen && !onSearchClick && (
        <div className="border-b border-hiqu-border/60 px-4 py-2">
          <input
            type="text"
            value={inlineSearch}
            onChange={(e) => setInlineSearch(e.target.value)}
            placeholder="Mesajlarda ara..."
            autoFocus
            className="w-full rounded-md bg-hiqu-elevated px-3 py-1.5 text-sm text-hiqu-text outline-none ring-1 ring-hiqu-border/60 focus:ring-hiqu-accent/50"
          />
        </div>
      )}

      <div ref={messagesRef} className="hiqu-messages-scroll flex-1 overflow-y-auto px-4 py-4">
        {query && visibleMessages.length === 0 && (
          <p className="py-8 text-center text-sm text-hiqu-muted">
            &quot;{effectiveSearch}&quot; için mesaj bulunamadı.
          </p>
        )}

        {!query && messages.length === 0 && (
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

        {visibleMessages.map((msg, index) => {
          const isMe = msg.authorId === "me" || msg.authorId === currentUser.id;
          const author = isMe ? currentUser : authorMap[msg.authorId];
          const prev = visibleMessages[index - 1];
          const authorKey = (id: string) => (id === "me" || id === currentUser.id ? currentUser.id : id);
          const compact = prev ? authorKey(prev.authorId) === authorKey(msg.authorId) : false;
          const isFirstMatch = query && index === 0;

          return (
            <div
              key={msg.id}
              ref={(el) => {
                messageRefs.current[msg.id] = el;
                if (isFirstMatch) firstMatchRef.current = el;
              }}
            >
              <MessageItem
                msg={msg}
                compact={compact}
                isMe={isMe}
                author={author}
                authorMap={authorMap}
                currentUserId={currentUser.id}
                highlighted={replyHighlightSet.has(msg.id)}
                isFirst={index === 0}
                highlightContent={highlightContent}
                onReply={setReplyTo}
                onPin={handlePin}
                onReact={(m, emoji) => onReact(m.id, emoji)}
                onForward={setForwardMsg}
                onJumpToReply={jumpToMessage}
              />
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {replyTo && (
        <div className="mx-4 mb-1 flex items-center gap-2 rounded-t-lg border border-b-0 border-hiqu-border/60 bg-hiqu-elevated/90 px-3 py-2 text-sm">
          <ReplyMini />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-hiqu-accent">
              {replyTo.authorId === "me" || replyTo.authorId === currentUser.id
                ? currentUser.name
                : authorMap[replyTo.authorId]?.name ?? "Bilinmeyen"}
              {" "}mesajına yanıt
            </p>
            <p className="truncate text-xs text-hiqu-muted">{replyTo.content}</p>
          </div>
          <button type="button" onClick={() => setReplyTo(null)} className="text-hiqu-muted hover:text-hiqu-text">
            <X className="size-4" />
          </button>
        </div>
      )}

      <form className="shrink-0 px-4 pb-4 pt-1" onSubmit={handleSubmit}>
        <div className={`hiqu-chat-input flex items-center gap-2 px-3 py-2 ${replyTo ? "rounded-t-none" : ""}`}>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={replyTo ? "Yanıtını yaz..." : placeholder}
            className="flex-1 bg-transparent text-sm text-hiqu-text outline-none"
          />
          <div ref={pickerAnchorRef} className="relative flex shrink-0 items-center gap-0.5">
            <EmojiGifPicker
              open={pickerOpen}
              tab={pickerTab}
              anchorRef={pickerAnchorRef}
              onTabChange={setPickerTab}
              onClose={() => setPickerOpen(false)}
              onEmojiSelect={handleEmoji}
              onGifSelect={handleGif}
            />
            <button
              type="button"
              onClick={() => togglePicker("gif")}
              className={`hiqu-chat-action rounded px-2 py-1 text-xs font-bold ${
                pickerOpen && pickerTab === "gif" ? "!bg-hiqu-accent !text-white" : ""
              }`}
            >
              GIF
            </button>
            <button
              type="button"
              onClick={() => togglePicker("emoji")}
              className={`hiqu-chat-action rounded p-1 ${
                pickerOpen && pickerTab === "emoji" ? "!bg-hiqu-accent !text-white" : ""
              }`}
            >
              <Smile className="size-5" />
            </button>
          </div>
        </div>
      </form>

      <PinnedMessagesModal
        open={pinnedOpen}
        messages={pinnedMessages}
        authorMap={authorMap}
        currentUser={currentUser}
        onClose={() => setPinnedOpen(false)}
        onUnpin={handleUnpin}
        onJump={jumpToMessage}
      />

      <ForwardMessageModal
        open={!!forwardMsg}
        preview={
          forwardMsg
            ? forwardMsg.content || forwardMsg.embed?.url || "Embed"
            : ""
        }
        destinations={forwardDestinations.filter((d) => {
          if (!forwardMsg) return false;
          if (d.type === "dm" && chatId === `dm-${d.id}`) return false;
          if (d.type === "group" && chatId === `group-${d.id}`) return false;
          if (d.type === "channel" && chatId === `channel-${d.id}`) return false;
          return true;
        })}
        onClose={() => setForwardMsg(null)}
        onSelect={handleForwardSelect}
      />
    </div>
  );
}

function HeaderIconBtn({
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
      className={`flex size-8 items-center justify-center rounded transition-colors ${
        active
          ? "bg-hiqu-hover text-hiqu-text"
          : "text-hiqu-icon-muted hover:bg-hiqu-hover hover:text-hiqu-text"
      }`}
    >
      {children}
    </button>
  );
}

function ReplyMini() {
  return (
    <svg className="size-4 shrink-0 text-hiqu-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 17l-4-4 4-4M5 13h12a4 4 0 000-8h-1" />
    </svg>
  );
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
