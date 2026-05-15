"use client";

import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  loading?: boolean;
  error?: string | null;
  requireText?: string;
  onConfirm: () => void;
  onClose: () => void;
};

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  loading = false,
  error = null,
  requireText,
  onConfirm,
  onClose,
}: Props) {
  const [typed, setTyped] = useState("");
  const confirmRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!open) {
      setTyped("");
      return;
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !loading) onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const t = window.setTimeout(() => confirmRef.current?.focus(), 50);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
      window.clearTimeout(t);
    };
  }, [open, loading, onClose]);

  if (!open) return null;

  const needsTyping = !!requireText;
  const typedMatches = !needsTyping || typed.trim() === requireText;
  const canConfirm = typedMatches && !loading;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center"
    >
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => {
          if (!loading) onClose();
        }}
      />
      <div className="relative w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-white shadow-2xl">
        <div className="flex items-start gap-4 px-6 pt-6">
          <span
            className={cn(
              "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full",
              destructive ? "bg-red-100 text-red-700" : "bg-brand-light text-brand"
            )}
            aria-hidden
          >
            <AlertTriangle className="h-5 w-5" />
          </span>
          <div className="flex-1 min-w-0">
            <h2
              id="confirm-dialog-title"
              className="font-display text-lg font-bold text-ink"
            >
              {title}
            </h2>
            <div className="mt-1 text-sm text-muted">{message}</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            aria-label="Close"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted hover:bg-soft hover:text-ink disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {needsTyping && (
          <div className="px-6 pt-4">
            <label className="text-xs font-medium uppercase tracking-wider text-muted">
              Type{" "}
              <span className="font-mono text-ink normal-case tracking-normal">
                {requireText}
              </span>{" "}
              to confirm
            </label>
            <input
              type="text"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              disabled={loading}
              autoComplete="off"
              spellCheck={false}
              className="mt-1 w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm font-mono text-ink shadow-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30 disabled:bg-soft"
            />
          </div>
        )}

        {error && (
          <div className="mx-6 mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="flex flex-col-reverse gap-2 px-6 pb-6 pt-5 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="inline-flex items-center justify-center rounded-full border border-black/10 bg-white px-5 py-2.5 text-sm font-semibold text-ink hover:bg-soft transition disabled:opacity-60"
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            type="button"
            onClick={onConfirm}
            disabled={!canConfirm}
            className={cn(
              "inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed",
              destructive
                ? "bg-red-600 hover:bg-red-700"
                : "bg-brand hover:bg-brand-dark"
            )}
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
