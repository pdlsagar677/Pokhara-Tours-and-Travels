"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import {
  Eye,
  Loader2,
  Mail,
  MailOpen,
  MailCheck,
  Search,
  Trash2,
} from "lucide-react";
import PageHeader from "@/components/admin/PageHeader";
import { adminService } from "@/lib/api/admin.service";
import { extractApiError } from "@/lib/api/client";
import type { ContactMessage, MessageStatus } from "@/types";

const MessageDetailDialog = dynamic(() => import("./MessageDetailDialog"), {
  ssr: false,
});

type StatusFilter = "" | MessageStatus;

export default function MessagesClient() {
  const [items, setItems] = useState<ContactMessage[]>([]);
  const [total, setTotal] = useState(0);
  const [unread, setUnread] = useState(0);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actingId, setActingId] = useState<string | null>(null);
  const [active, setActive] = useState<ContactMessage | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminService.listMessages({
        q: q.trim() || undefined,
        status: statusFilter || undefined,
        limit: 100,
      });
      setItems(res.items);
      setTotal(res.total);
      setUnread(res.unread);
    } catch (err) {
      setError(extractApiError(err, "Could not load messages"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    load();
  };

  const replaceRow = (updated: ContactMessage) => {
    setItems((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
    if (active?.id === updated.id) setActive(updated);
  };

  const openMessage = async (m: ContactMessage) => {
    setActive(m);
    if (m.status === "new") {
      try {
        const updated = await adminService.markMessageRead(m.id);
        replaceRow(updated);
        setUnread((u) => Math.max(0, u - 1));
      } catch {
        // best-effort
      }
    }
  };

  const remove = async (m: ContactMessage) => {
    if (!window.confirm(`Delete message from ${m.name}? This cannot be undone.`)) {
      return;
    }
    setActingId(m.id);
    try {
      await adminService.deleteMessage(m.id);
      setItems((prev) => prev.filter((x) => x.id !== m.id));
      setTotal((t) => Math.max(0, t - 1));
      if (m.status === "new") setUnread((u) => Math.max(0, u - 1));
      if (active?.id === m.id) setActive(null);
    } catch (err) {
      setError(extractApiError(err, "Could not delete message"));
    } finally {
      setActingId(null);
    }
  };

  return (
    <>
      <PageHeader
        title="Messages"
        description={`${total} ${total === 1 ? "message" : "messages"} · ${unread} unread.`}
        action={
          <form onSubmit={onSearch} className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
              <input
                type="search"
                placeholder="Search name, email, subject…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="w-72 rounded-full border border-black/10 bg-white pl-9 pr-4 py-2 text-sm focus:border-brand focus:outline-none"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="rounded-full border border-black/10 bg-white px-3 py-2 text-sm focus:border-brand focus:outline-none"
            >
              <option value="">All statuses</option>
              <option value="new">New</option>
              <option value="read">Read</option>
              <option value="replied">Replied</option>
            </select>
            <button
              type="submit"
              className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark transition"
            >
              Search
            </button>
          </form>
        }
      />

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="rounded-2xl border border-black/5 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center p-14 text-muted">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <div className="p-14 text-center text-sm text-muted">
            No messages found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-soft text-xs uppercase tracking-wider text-muted">
                <tr>
                  <th className="px-5 py-3 text-left font-semibold">From</th>
                  <th className="px-5 py-3 text-left font-semibold">Subject</th>
                  <th className="px-5 py-3 text-left font-semibold">Received</th>
                  <th className="px-5 py-3 text-left font-semibold">Status</th>
                  <th className="px-5 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {items.map((m) => (
                  <tr
                    key={m.id}
                    className={`hover:bg-soft/60 ${
                      m.status === "new" ? "bg-brand-light/30" : ""
                    }`}
                  >
                    <td className="px-5 py-3">
                      <div
                        className={`text-ink ${
                          m.status === "new" ? "font-bold" : "font-semibold"
                        }`}
                      >
                        {m.name}
                      </div>
                      <div className="text-xs text-muted">{m.email}</div>
                    </td>
                    <td className="px-5 py-3">
                      <div
                        className={`text-ink line-clamp-1 ${
                          m.status === "new" ? "font-bold" : ""
                        }`}
                      >
                        {m.subject}
                      </div>
                      <div className="text-xs text-muted line-clamp-1">
                        {m.message}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-xs text-muted whitespace-nowrap">
                      {new Date(m.createdAt).toLocaleString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge status={m.status} replies={m.replies.length} />
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => openMessage(m)}
                          className="inline-flex items-center gap-1 rounded-full border border-brand/20 bg-brand-light px-2.5 py-1.5 text-xs font-semibold text-brand-dark hover:bg-brand/10 transition"
                        >
                          <Eye className="h-3 w-3" />
                          Open
                        </button>
                        <button
                          type="button"
                          onClick={() => remove(m)}
                          disabled={actingId === m.id}
                          className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 transition disabled:opacity-50"
                        >
                          {actingId === m.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Trash2 className="h-3 w-3" />
                          )}
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <MessageDetailDialog
        message={active}
        onClose={() => setActive(null)}
        onUpdated={replaceRow}
      />
    </>
  );
}

function StatusBadge({
  status,
  replies,
}: {
  status: MessageStatus;
  replies: number;
}) {
  if (status === "new") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-accent/15 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-accent">
        <Mail className="h-3 w-3" />
        New
      </span>
    );
  }
  if (status === "replied") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-green-800">
        <MailCheck className="h-3 w-3" />
        Replied · {replies}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-soft px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-ink">
      <MailOpen className="h-3 w-3" />
      Read
    </span>
  );
}
