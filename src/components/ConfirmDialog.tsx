import type { ReactNode } from "react";

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  children?: ReactNode;
}

export function ConfirmDialog({
  title,
  message,
  confirmLabel = "Evet",
  cancelLabel = "Hayır",
  danger,
  onConfirm,
  onCancel,
  children,
}: ConfirmDialogProps) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-sm rounded-xl bg-hiqu-panel shadow-2xl">
        <div className="border-b border-hiqu-border px-4 py-3">
          <h2 className="font-semibold">{title}</h2>
        </div>
        <div className="px-4 py-4">
          <p className="text-sm text-hiqu-muted">{message}</p>
          {children && <div className="mt-4">{children}</div>}
        </div>
        <div className="flex justify-end gap-2 border-t border-hiqu-border px-4 py-3">
          <button
            onClick={onCancel}
            className="rounded-lg px-4 py-2 text-sm text-hiqu-muted hover:bg-hiqu-hover hover:text-hiqu-text"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`rounded-lg px-4 py-2 text-sm font-medium text-white ${
              danger ? "bg-hiqu-dnd hover:bg-hiqu-dnd/90" : "bg-hiqu-accent hover:bg-hiqu-accent-hover"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
