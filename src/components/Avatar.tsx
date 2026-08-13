import type { Status } from "../types";

const statusColors: Record<Status, string> = {
  online: "bg-hiqu-online",
  idle: "bg-hiqu-idle",
  dnd: "bg-hiqu-dnd",
  offline: "bg-hiqu-muted",
};

interface AvatarProps {
  src: string;
  alt: string;
  size?: "sm" | "md" | "lg" | "xl";
  status?: Status;
  className?: string;
}

const sizeClasses = {
  sm: "size-8",
  md: "size-10",
  lg: "size-16",
  xl: "size-20",
};

const statusSizeClasses = {
  sm: "size-2.5 border-[2px]",
  md: "size-3 border-[2.5px]",
  lg: "size-4 border-[3px]",
  xl: "size-5 border-[3px]",
};

export function Avatar({ src, alt, size = "md", status, className = "" }: AvatarProps) {
  return (
    <div className={`relative shrink-0 ${className}`}>
      <img
        src={src}
        alt={alt}
        className={`${sizeClasses[size]} rounded-full object-cover bg-hiqu-elevated`}
      />
      {status && status !== "offline" && (
        <span
          className={`absolute bottom-0 right-0 rounded-full border-hiqu-panel ${statusColors[status]} ${statusSizeClasses[size]}`}
        />
      )}
    </div>
  );
}
