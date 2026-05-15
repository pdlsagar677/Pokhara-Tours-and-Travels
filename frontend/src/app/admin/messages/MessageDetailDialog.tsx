"use client";

import { useEffect, useState } from "react";
import { Loader2, Mail, Reply, Send, X } from "lucide-react";
import { adminService } from "@/lib/api/admin.service";
import { extractApiError } from "@/lib/api/client";
import type { ContactMessage } from "@/types";

const MAX_REPLY = 5000;

type Props = {
  message: ContactMessage | null;
  onClose: () => void;
  onUpdated: (msg: ContactMessage) => void;
};

export default function MessageDetailDialog({
  message,
  onClose,
  onUpdated,
}: Props) {
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!message) {
      setBody("");
      setError(null);
      setSending(false);
    }
  }, [message]);

  if (!message) return null;

  const onSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) {
      setError("Reply cannot be empty");
      return;
    }
    setSending(true);
    setError(null);
    try {
      const updated = await adminService.replyToMessage(message.id, body.trim());
      onUpdated(updated);
      setBody("");
    } catch (err) {
      setError(extractApiError(err, "Could not send reply"));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-white shadow-xl">
        <header className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-black/5 bg-white px-6 py-4">
          <div className="min-w-0">
            <h2 className="font-display text-lg font-bold text-ink line-clamp-1">
              {message.subject}
            </h2>
            <p className="mt-0.5 text-xs text-muted">
              From <span className="font-semibold text-ink">{message.name}</span>{" "}
              ·{" "}
              <a
                href={`mailto:${message.email}`}
                className="font-semibold text-brand hover:text-brand-dark"
              >
                {message.email}
              </a>{" "}
              ·{" "}
              {new Date(message.createdAt).toLocaleString(undefined, {
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-muted hover:bg-soft hover:text-ink"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="px-6 py-6 space-y-6">
          {/* Original */}
          <article className="rounded-2xl border border-black/5 bg-soft p-5">
            <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-muted">
              <Mail className="h-3.5 w-3.5" />
              Original message
            </div>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink">
              {message.message}
            </p>
          </article>

          {/* Reply history */}
          {message.replies.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted">
                {message.replies.length} repl
                {message.replies.length === 1 ? "y" : "ies"} sent
              </p>
              {message.replies.map((r, i) => (
                <article
                  key={i}
                  className="rounded-2xl border border-brand/15 bg-brand-light/40 p-5"
                >
                  <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-brand-dark">
                    <Reply className="h-3.5 w-3.5" />
                    You replied ·{" "}
                    {new Date(r.sentAt).toLocaleString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink">
                    {r.body}
                  </p>
                </article>
              ))}
            </div>
          )}

          {/* Reply form */}
          <form onSubmit={onSend} className="space-y-3">
            <label htmlFor="reply" className="text-sm font-medium text-ink">
              {message.replies.length > 0 ? "Send another reply" : "Write a reply"}
            </label>
            <textarea
              id="reply"
              rows={6}
              maxLength={MAX_REPLY}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Type your reply — it will be emailed to the sender."
              className="w-full rounded-xl border border-black/10 px-4 py-3 text-sm focus:border-brand focus:outline-none"
            />
            <div className="flex items-center justify-between text-[11px] text-muted">
              <span>
                {body.length}/{MAX_REPLY}
              </span>
              <span>Will be sent from hello@pokharatours.com</span>
            </div>

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-black/10 px-5 py-2 text-sm font-semibold text-ink transition hover:bg-soft"
              >
                Close
              </button>
              <button
                type="submit"
                disabled={sending || !body.trim()}
                className="inline-flex items-center gap-2 rounded-full bg-brand px-6 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
              >
                {sending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Send reply
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
