import type { MessageEmbed } from "./types.js";

const YOUTUBE_RE =
  /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11})/;

export function detectEmbed(content: string): MessageEmbed | null {
  const match = content.match(YOUTUBE_RE);
  if (match) {
    const videoId = match[1];
    return {
      type: "youtube",
      title: "YouTube Video",
      url: `https://www.youtube.com/watch?v=${videoId}`,
      thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
    };
  }

  const gifMatch =
    content.match(/https?:\/\/[^\s]+\.(gif|webp)(\?[^\s]*)?/i) ??
    content.match(/https?:\/\/media\.giphy\.com\/media\/[^\s]+\/giphy\.gif/i);
  if (gifMatch) {
    const url = gifMatch[0];
    return { type: "gif", title: "GIF", url, thumbnail: url };
  }

  return null;
}

export function formatTimestamp(ms: number): string {
  const date = new Date(ms);
  const now = new Date();
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  const time = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  if (isToday) return `Today at ${time}`;

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  if (isYesterday) return `Yesterday at ${time}`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  }) + ` at ${time}`;
}
