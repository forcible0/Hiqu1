import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

export const UPLOADS_ROOT = join(process.cwd(), "data", "uploads");

const MAX_BYTES = 2 * 1024 * 1024;

export function saveUserImage(userId: string, kind: "avatar" | "banner", dataUrl: string): string {
  return saveImage(`${userId}`, kind, dataUrl);
}

export function saveServerImage(serverId: string, kind: "icon" | "banner", dataUrl: string): string {
  return saveImage(`servers/${serverId}`, kind, dataUrl);
}

function saveImage(relativeDir: string, kind: string, dataUrl: string): string {
  const match = /^data:image\/(png|jpe?g|webp|gif);base64,(.+)$/i.exec(dataUrl);
  if (!match) throw new Error("Geçersiz görsel dosyası");

  const ext = match[1]!.toLowerCase().replace("jpeg", "jpg");
  const buffer = Buffer.from(match[2]!, "base64");
  if (buffer.length > MAX_BYTES) throw new Error("Görsel en fazla 2MB olabilir");

  const dir = join(UPLOADS_ROOT, relativeDir);
  mkdirSync(dir, { recursive: true });

  const filename = `${kind}.${ext}`;
  writeFileSync(join(dir, filename), buffer);

  return `/uploads/${relativeDir}/${filename}?v=${Date.now()}`;
}
