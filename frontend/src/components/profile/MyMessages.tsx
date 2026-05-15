"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Inbox,
  Loader2,
  Mail,
  MailCheck,
  MailOpen,
  Reply,
} from "lucide-react";
import { contactService } from "@/lib/api/contact.service";
import { extractApiError } from "@/lib/api/client";
import type { ContactMessage, MessageStatus } from "@/types";

export default function MyMessages() {
  const [messages, setMessages] = useState<ContactMessage[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const items = await contactService.listMine();
        if (!cancelled) setMessages(items);
      } catch (err) {
        if (!cancelled) setError(extractApiError(err, "Could not load messages"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-light text-brand">
            <Inbox className="h-5 w-5" />
          </span>
          <div>
            <h2 className="font-display text-lg font-bold text-ink">My messages</h2>
            <p className="text-xs text-muted">
              Conversations you&apos;ve started with our team.
            </p>
          </div>
        </div>
        <Link
          href="/contact"
          className="text-sm font-semibold text-brand hover:text-brand-dark"
        >
          New message →
        </Link>
      </header>

      {loading && (
        <div className="mt-8 flex items-center justify-center text-muted">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      )}

      {!loading && error && (
        <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {!loading && !error && messages && messages.length === 0 && (
        <div className="mt-6 rounded-2xl border border-dashed border-black/10 bg-soft p-8 text-center">
          <p className="text-sm text-muted">
            You haven&apos;t sent us any messages yet.
          </p>
          <Link
            href="/contact"
            className="mt-4 inline-flex items-center rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white hover:bg-brand-dark transition"
          >
            Start a conversation
          </Link>
        </div>
      )}

      {!loading && !error && messages && messages.length > 0 && (
        <ul className="mt-6 space-y-3">
          {messages.map((m) => {
            const open = expandedId === m.id;
            return (
              <li
                key={m.id}
                className="overflow-hidden rounded-2xl border border-black/5 bg-white"
              >
                <button
                  type="button"
                  onClick={() => setExpandedId(open ? null : m.id)}
                  aria-expanded={open}
                  className="flex w-full items-start justify-between gap-3 p-4 text-left transition hover:bg-soft/60"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-ink line-clamp-1">
                        {m.subject}
                      </p>
                      <StatusBadge
                        status={m.status}
                        replies={m.replies.length}
                      />
                    </div>
                    <p className="mt-1 text-xs text-muted">
                      Sent{" "}
                      {new Date(m.createdAt).toLocaleString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                    {!open && (
                      <p className="mt-2 text-sm text-muted line-clamp-2">
                        {m.message}
                      </p>
                    )}
                  </div>
                  <span className="mt-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-soft text-muted">
                    {open ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </span>
                </button>

                {open && (
                  <div className="space-y-3 border-t border-black/5 bg-soft/40 p-4">
                    <article className="rounded-xl border border-black/5 bg-white p-4">
                      <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-muted">
                        <Mail className="h-3 w-3" />
                        You wrote
                      </div>
                      <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink">
                        {m.message}
                      </p>
                    </article>

                    {m.replies.length > 0 ? (
                      m.replies.map((r, i) => (
                        <article
                          key={i}
                          className="rounded-xl border border-brand/15 bg-brand-light/40 p-4"
                        >
                          <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-brand-dark">
                            <Reply className="h-3 w-3" />
                            Pokhara Tours team replied ·{" "}
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
                      ))
                    ) : (
                      <p className="rounded-xl border border-dashed border-black/10 bg-white px-4 py-3 text-center text-xs text-muted">
                        No reply yet — we usually answer within a few hours.
                      </p>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function StatusBadge({
  status,
  replies,
}: {
  status: MessageStatus;
  replies: number;
}) {
  if (status === "replied") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-green-800">
        <MailCheck className="h-3 w-3" />
        {replies > 1 ? `${replies} replies` : "Replied"}
      </span>
    );
  }
  if (status === "read") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-soft px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-ink">
        <MailOpen className="h-3 w-3" />
        Seen
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-accent">
      <Mail className="h-3 w-3" />
      Awaiting reply
    </span>
  );
}
