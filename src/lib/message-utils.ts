import type { Message, User } from "../types";

export function enrichMessageReply(
  message: Message,
  existing: Message[],
  authorMap: Record<string, User>,
  currentUser: User,
): Message {
  if (!message.replyToId || message.replyTo) return message;
  const ref = existing.find((m) => m.id === message.replyToId);
  if (!ref) return message;
  const realId = ref.authorId === "me" ? currentUser.id : ref.authorId;
  const author = ref.authorId === "me" || ref.authorId === currentUser.id ? currentUser : authorMap[realId];
  return {
    ...message,
    replyTo: {
      id: ref.id,
      authorId: ref.authorId,
      authorName: author?.name ?? (ref.authorId === "me" ? "Sen" : "Bilinmeyen"),
      content: ref.content.slice(0, 120) || (ref.embed ? "Embed" : ""),
    },
  };
}

export function buildReplyHighlightSet(messages: Message[]): Set<string> {
  const ids = new Set<string>();
  for (const msg of messages) {
    if (msg.replyToId) {
      ids.add(msg.id);
      ids.add(msg.replyToId);
    }
  }
  return ids;
}

export function buildForwardContent(authorName: string, msg: Message): string {
  const body = msg.content || msg.embed?.url || "Embed";
  return `↪ **${authorName}**: ${body}`;
}

export function mapRawReactions(
  reactions: { emoji: string; userIds: string[] }[],
  currentUserId: string,
) {
  return reactions
    .filter((r) => r.userIds.length > 0)
    .map((r) => ({
      emoji: r.emoji,
      userIds: r.userIds.map((id) => (id === currentUserId ? "me" : id)),
    }));
}

export function patchMessageReactions(
  messages: Message[],
  messageId: string,
  reactions: { emoji: string; userIds: string[] }[],
  currentUserId: string,
): Message[] {
  const mapped = mapRawReactions(reactions, currentUserId);
  return messages.map((m) =>
    m.id === messageId ? { ...m, reactions: mapped.length > 0 ? mapped : undefined } : m,
  );
}
