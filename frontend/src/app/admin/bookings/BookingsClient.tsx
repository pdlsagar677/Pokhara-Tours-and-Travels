"use client";

import { useEffect, useState } from "react";
import {
  CheckCircle2,
  Loader2,
  RotateCcw,
  Search,
  Trash2,
  Wallet,
  XCircle,
} from "lucide-react";
import PageHeader from "@/components/admin/PageHeader";
import { adminService } from "@/lib/api/admin.service";
import { extractApiError } from "@/lib/api/client";
import { formatNPR } from "@/lib/utils";
import type {
  AdminBooking,
  BookingStatus,
  PaymentStatus,
} from "@/types";

type StatusFilter = "" | BookingStatus;
type PaymentFilter = "" | PaymentStatus;

export default function BookingsClient() {
  const [items, setItems] = useState<AdminBooking[]>([]);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("");
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actingId, setActingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminService.listBookings({
        q: q.trim() || undefined,
        status: statusFilter || undefined,
        paymentStatus: paymentFilter || undefined,
        limit: 100,
      });
      setItems(res.items);
      setTotal(res.total);
    } catch (err) {
      setError(extractApiError(err, "Could not load bookings"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, paymentFilter]);

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    load();
  };

  const replaceRow = (updated: AdminBooking) => {
    setItems((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
  };

  const markPaid = async (b: AdminBooking) => {
    setActingId(b.id);
    try {
      const updated = await adminService.updateBookingPayment(b.id, "paid");
      replaceRow(updated);
    } catch (err) {
      setError(extractApiError(err, "Could not mark booking as paid"));
    } finally {
      setActingId(null);
    }
  };

  const toggleStatus = async (b: AdminBooking) => {
    const next: BookingStatus =
      b.status === "confirmed" ? "cancelled" : "confirmed";
    setActingId(b.id);
    try {
      const updated = await adminService.updateBookingStatus(b.id, next);
      replaceRow(updated);
    } catch (err) {
      setError(extractApiError(err, "Could not update booking status"));
    } finally {
      setActingId(null);
    }
  };

  const remove = async (b: AdminBooking) => {
    if (!window.confirm(`Delete this booking for ${b.contact.name}? This cannot be undone.`)) {
      return;
    }
    setActingId(b.id);
    try {
      await adminService.deleteBooking(b.id);
      setItems((prev) => prev.filter((x) => x.id !== b.id));
      setTotal((t) => Math.max(0, t - 1));
    } catch (err) {
      setError(extractApiError(err, "Could not delete booking"));
    } finally {
      setActingId(null);
    }
  };

  return (
    <>
      <PageHeader
        title="Bookings"
        description={`${total} ${total === 1 ? "booking" : "bookings"} in the system. Confirm trips, mark payments, and manage cancellations.`}
        action={
          <form onSubmit={onSearch} className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
              <input
                type="search"
                placeholder="Search name, email, package…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="w-64 rounded-full border border-black/10 bg-white pl-9 pr-4 py-2 text-sm focus:border-brand focus:outline-none"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="rounded-full border border-black/10 bg-white px-3 py-2 text-sm focus:border-brand focus:outline-none"
            >
              <option value="">All statuses</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value as PaymentFilter)}
              className="rounded-full border border-black/10 bg-white px-3 py-2 text-sm focus:border-brand focus:outline-none"
            >
              <option value="">All payments</option>
              <option value="advance_pending">Advance pending</option>
              <option value="awaiting_arrival">Pay on arrival</option>
              <option value="paid">Paid</option>
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
            No bookings found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-soft text-xs uppercase tracking-wider text-muted">
                <tr>
                  <th className="px-5 py-3 text-left font-semibold">Customer</th>
                  <th className="px-5 py-3 text-left font-semibold">Package</th>
                  <th className="px-5 py-3 text-left font-semibold">Travel date</th>
                  <th className="px-5 py-3 text-left font-semibold">Travelers</th>
                  <th className="px-5 py-3 text-left font-semibold">Total</th>
                  <th className="px-5 py-3 text-left font-semibold">Status</th>
                  <th className="px-5 py-3 text-left font-semibold">Payment</th>
                  <th className="px-5 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {items.map((b) => (
                  <BookingRow
                    key={b.id}
                    booking={b}
                    busy={actingId === b.id}
                    onMarkPaid={() => markPaid(b)}
                    onToggleStatus={() => toggleStatus(b)}
                    onDelete={() => remove(b)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

function BookingRow({
  booking: b,
  busy,
  onMarkPaid,
  onToggleStatus,
  onDelete,
}: {
  booking: AdminBooking;
  busy: boolean;
  onMarkPaid: () => void;
  onToggleStatus: () => void;
  onDelete: () => void;
}) {
  const title = b.packageSnapshot?.title || b.packageSlug;
  const isPaid = b.paymentStatus === "paid";
  const isCancelled = b.status === "cancelled";

  return (
    <tr className="hover:bg-soft/60 align-top">
      <td className="px-5 py-3">
        <div className="font-semibold text-ink">{b.contact.name}</div>
        <div className="text-xs text-muted">{b.contact.email}</div>
        <div className="text-xs text-muted">{b.contact.phone}</div>
      </td>
      <td className="px-5 py-3">
        <div className="font-semibold text-ink line-clamp-1">{title}</div>
        <div className="text-xs text-muted">/{b.packageSlug}</div>
      </td>
      <td className="px-5 py-3 text-ink">
        {new Date(b.startDate).toLocaleDateString(undefined, {
          year: "numeric",
          month: "short",
          day: "numeric",
        })}
      </td>
      <td className="px-5 py-3 text-ink">
        {b.travelers.adults} adult{b.travelers.adults === 1 ? "" : "s"}
        {b.travelers.children > 0 &&
          `, ${b.travelers.children} child${
            b.travelers.children === 1 ? "" : "ren"
          }`}
      </td>
      <td className="px-5 py-3 font-bold text-ink">{formatNPR(b.totalNPR)}</td>
      <td className="px-5 py-3">
        <StatusBadge status={b.status} />
      </td>
      <td className="px-5 py-3">
        <PaymentBadge status={b.paymentStatus} />
      </td>
      <td className="px-5 py-3">
        <div className="flex items-center justify-end gap-1.5">
          {!isPaid && (
            <button
              type="button"
              onClick={onMarkPaid}
              disabled={busy}
              title="Mark as paid"
              className="inline-flex items-center gap-1 rounded-full border border-green-200 bg-green-50 px-2.5 py-1.5 text-xs font-semibold text-green-700 hover:bg-green-100 transition disabled:opacity-50"
            >
              {busy ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Wallet className="h-3 w-3" />
              )}
              Paid
            </button>
          )}
          <button
            type="button"
            onClick={onToggleStatus}
            disabled={busy}
            title={isCancelled ? "Confirm booking" : "Cancel booking"}
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-semibold transition disabled:opacity-50 ${
              isCancelled
                ? "border border-brand/20 bg-brand-light text-brand-dark hover:bg-brand/10"
                : "border border-yellow-200 bg-yellow-50 text-yellow-800 hover:bg-yellow-100"
            }`}
          >
            {busy ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : isCancelled ? (
              <RotateCcw className="h-3 w-3" />
            ) : b.status === "confirmed" ? (
              <XCircle className="h-3 w-3" />
            ) : (
              <CheckCircle2 className="h-3 w-3" />
            )}
            {isCancelled
              ? "Reinstate"
              : b.status === "confirmed"
                ? "Cancel"
                : "Confirm"}
          </button>
          <button
            type="button"
            onClick={onDelete}
            disabled={busy}
            title="Delete booking"
            className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 transition disabled:opacity-50"
          >
            {busy ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Trash2 className="h-3 w-3" />
            )}
            Delete
          </button>
        </div>
      </td>
    </tr>
  );
}

function StatusBadge({ status }: { status: BookingStatus }) {
  const styles: Record<BookingStatus, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    confirmed: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold capitalize ${styles[status]}`}
    >
      {status}
    </span>
  );
}

function PaymentBadge({ status }: { status: PaymentStatus }) {
  const labels: Record<PaymentStatus, string> = {
    advance_pending: "Advance pending",
    awaiting_arrival: "Pay on arrival",
    paid: "Paid",
  };
  const styles: Record<PaymentStatus, string> = {
    advance_pending: "bg-brand-light text-brand-dark",
    awaiting_arrival: "bg-soft text-ink",
    paid: "bg-green-100 text-green-800",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}
