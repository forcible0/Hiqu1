import data from "@emoji-mart/data";
import i18n from "@emoji-mart/data/i18n/tr.json";
import Picker from "@emoji-mart/react";
import { Loader2, Search, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import * as api from "../api/client";

const PICKER_HEIGHT = 380;
const PICKER_WIDTH = 360;

interface EmojiGifPickerProps {
  open: boolean;
  tab: "emoji" | "gif";
  anchorRef: RefObject<HTMLDivElement | null>;
  onTabChange: (tab: "emoji" | "gif") => void;
  onClose: () => void;
  onEmojiSelect: (emoji: string) => void;
  onGifSelect: (url: string) => void;
  emojiOnly?: boolean;
}

export function EmojiGifPicker({
  open,
  tab,
  anchorRef,
  onTabChange,
  onClose,
  onEmojiSelect,
  onGifSelect,
  emojiOnly = false,
}: EmojiGifPickerProps) {
  const [search, setSearch] = useState("");
  const [gifs, setGifs] = useState<api.GifItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hoveredGif, setHoveredGif] = useState<api.GifItem | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      const anchor = anchorRef.current;
      const target = e.target as Node;
      if (ref.current?.contains(target)) return;
      if (anchor?.contains(target)) return;
      onClose();
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open, onClose, anchorRef]);

  useEffect(() => {
    if (open && tab === "gif" && !emojiOnly) {
      searchRef.current?.focus();
    }
  }, [open, tab]);

  const loadGifs = useCallback(async (query: string) => {
    setLoading(true);
    setError(null);
    try {
      const results = query.trim()
        ? await api.searchGifs(query.trim())
        : await api.fetchTrendingGifs();
      setGifs(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : "GIF yüklenemedi");
      setGifs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open || tab !== "gif") return;
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      await loadGifs(search);
      if (cancelled) return;
    }, search.trim() ? 350 : 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [open, tab, search, loadGifs]);

  const handleEmojiPick = useCallback(
    (emoji: { native: string }) => {
      onEmojiSelect(emoji.native);
    },
    [onEmojiSelect],
  );

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadGifs(search);
  };

  if (!open) return null;

  const activeTab = emojiOnly ? "emoji" : tab;

  return (
    <div
      ref={ref}
      className="absolute bottom-full right-0 z-50 mb-2 flex flex-col overflow-hidden rounded-lg border border-hiqu-border/60 bg-hiqu-elevated shadow-2xl"
      style={{
        width: emojiOnly ? 320 : PICKER_WIDTH,
        maxHeight: `min(${emojiOnly ? PICKER_HEIGHT : PICKER_HEIGHT + 88}px, calc(100dvh - 120px))`,
      }}
    >
      {!emojiOnly && (
        <div className="flex shrink-0 border-b border-hiqu-border/40 p-1">
          <TabButton active={tab === "gif"} onClick={() => onTabChange("gif")}>
            GIF
          </TabButton>
          <TabButton active={tab === "emoji"} onClick={() => onTabChange("emoji")}>
            Emoji
          </TabButton>
          <button
            type="button"
            onClick={onClose}
            className="ml-auto p-1.5 text-hiqu-muted hover:text-hiqu-text"
          >
            <X className="size-4" />
          </button>
        </div>
      )}

      {activeTab === "gif" && !emojiOnly && (
        <>
          <form
            onSubmit={handleSearchSubmit}
            className="flex shrink-0 items-center gap-1.5 border-b border-hiqu-border/40 px-2 py-1.5"
          >
            <div className="flex min-w-0 flex-1 items-center gap-1.5 rounded-md bg-hiqu-panel px-2 py-1">
              <Search className="size-3.5 shrink-0 text-hiqu-muted" />
              <input
                ref={searchRef}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="GIF ara..."
                className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-hiqu-muted"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="shrink-0 rounded-md bg-hiqu-accent px-2.5 py-1 text-xs font-semibold text-white hover:bg-hiqu-accent-hover disabled:opacity-50"
            >
              Ara
            </button>
          </form>

          <div
            className="relative shrink-0 overflow-y-auto p-1.5"
            style={{ height: PICKER_HEIGHT - 40 }}
          >
            {loading && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-hiqu-elevated/80">
                <Loader2 className="size-5 animate-spin text-hiqu-muted" />
              </div>
            )}

            {error && !loading && (
              <div className="flex h-full flex-col items-center justify-center gap-2 px-3 text-center text-xs text-hiqu-muted">
                <p>{error}</p>
                {error.includes("GIPHY_API_KEY") && (
                  <p className="text-[11px] leading-relaxed">
                    <code className="text-hiqu-text">.env</code> dosyasına{" "}
                    <code className="text-hiqu-text">GIPHY_API_KEY</code> ekle.
                  </p>
                )}
              </div>
            )}

            {!error && gifs.length > 0 && (
              <div className="grid grid-cols-2 gap-1.5">
                {gifs.map((gif) => (
                  <button
                    key={gif.id}
                    type="button"
                    onClick={() => onGifSelect(gif.url)}
                    onMouseEnter={() => setHoveredGif(gif)}
                    onMouseLeave={() => setHoveredGif(null)}
                    className="aspect-[4/3] overflow-hidden rounded-md bg-hiqu-panel hover:ring-2 hover:ring-hiqu-accent"
                  >
                    <img
                      src={gif.previewUrl}
                      alt={gif.title}
                      loading="lazy"
                      className="size-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}

            {!loading && !error && gifs.length === 0 && search.trim() && (
              <p className="py-6 text-center text-xs text-hiqu-muted">Sonuç bulunamadı.</p>
            )}
          </div>

          <div className="flex h-8 shrink-0 items-center gap-2 border-t border-hiqu-border/40 px-2 text-xs text-hiqu-muted">
            {hoveredGif ? (
              <>
                <img src={hoveredGif.previewUrl} alt="" className="size-5 rounded object-cover" />
                <span className="truncate">{hoveredGif.title}</span>
              </>
            ) : (
              <span>GIF seç veya yukarıdan ara</span>
            )}
          </div>
        </>
      )}

      {activeTab === "emoji" && (
        <div
          className="hiqu-emoji-picker shrink-0 overflow-hidden"
          style={{ height: PICKER_HEIGHT }}
        >
          <Picker
            data={data}
            i18n={i18n}
            locale="tr"
            theme="dark"
            previewPosition="none"
            searchPosition="sticky"
            skinTonePosition="search"
            navPosition="top"
            maxFrequentRows={2}
            perLine={9}
            onEmojiSelect={handleEmojiPick}
          />
        </div>
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
        active ? "bg-hiqu-panel text-hiqu-text" : "text-hiqu-muted hover:text-hiqu-text"
      }`}
    >
      {children}
    </button>
  );
}
