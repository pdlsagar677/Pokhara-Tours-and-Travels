"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Plane, X } from "lucide-react";
import { bookingsService } from "@/lib/api/bookings.service";
import { extractApiError } from "@/lib/api/client";
import { formatNPR } from "@/lib/utils";
import EsewaPayButton from "@/components/booking/EsewaPayButton";
import type { Booking } from "@/types";

const CANCEL_LEAD_TIME_MS = 24 * 60 * 60 * 1000;

export default function MyBookings() {
  const [bookings, setBookings] = useState<Booking[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const items = await bookingsService.listMine();
        if (!cancelled) setBookings(items);
      } catch (err) {
        if (!cancelled) setError(extractApiError(err, "Could not load bookings"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function replaceBooking(updated: Booking) {
    setBookings((prev) =>
      prev ? prev.map((b) => (b.id === updated.id ? updated : b)) : prev
    );
  }

  return (
    <section className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-light text-brand">
            <Plane className="h-5 w-5" />
          </span>
          <div>
            <h2 className="font-display text-lg font-bold text-ink">My bookings</h2>
            <p className="text-xs text-muted">Your trips with Pokhara Tours and Travel.</p>
          </div>
        </div>
        <Link
          href="/destinations"
          className="text-sm font-semibold text-brand hover:text-brand-dark"
        >
          Browse packages →
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

      {!loading && !error && bookings && bookings.length === 0 && (
        <div className="mt-6 rounded-2xl border border-dashed border-black/10 bg-soft p-8 text-center">
          <p className="text-sm text-muted">You don&apos;t have any bookings yet.</p>
          <Link
            href="/destinations"
            className="mt-4 inline-flex items-center rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white hover:bg-brand-dark transition"
          >
            Find your next trip
          </Link>
        </div>
      )}

      {!loading && !error && bookings && bookings.length > 0 && (
        <ul className="mt-6 divide-y divide-black/5">
          {bookings.map((b) => (
            <BookingRow key={b.id} booking={b} onCancelled={replaceBooking} />
          ))}
        </ul>
      )}
    </section>
  );
}

function BookingRow({
  booking: b,
  onCancelled,
}: {
  booking: Booking;
  onCancelled: (b: Booking) => void;
}) {
  const title = b.packageSnapshot?.title || b.packageSlug;
  const [busy, setBusy] = useState(false);
  const [rowError, setRowError] = useState<string | null>(null);

  const [leadOk] = useState(
    () => new Date(b.startDate).getTime() - Date.now() >= CANCEL_LEAD_TIME_MS
  );
  const canCancel =
    b.status === "pending" && b.paymentStatus !== "paid" && leadOk;
  const canPayOnline =
    b.status !== "cancelled" &&
    b.paymentMethod === "advance" &&
    b.paymentStatus !== "paid";

  async function handleCancel() {
    if (!window.confirm("Cancel this booking? This cannot be undone.")) return;
    setBusy(true);
    setRowError(null);
    try {
      const updated = await bookingsService.cancelMine(b.id);
      onCancelled(updated);
    } catch (err) {
      setRowError(extractApiError(err, "Could not cancel booking"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <li className="py-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-ink line-clamp-1">{title}</p>
          <p className="mt-0.5 text-xs text-muted">
            {new Date(b.startDate).toLocaleDateString(undefined, {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}{" "}
            · {b.travelers.adults} adult{b.travelers.adults === 1 ? "" : "s"}
            {b.travelers.children > 0 &&
              `, ${b.travelers.children} child${
                b.travelers.children === 1 ? "" : "ren"
              }`}
          </p>
          <p className="mt-2 text-sm font-bold text-ink">
            {formatNPR(b.totalNPR)}
          </p>
          {b.status === "pending" && b.paymentStatus !== "paid" && !leadOk && (
            <p className="mt-1 text-[11px] text-muted">
              Less than 24 hours away — contact us to cancel.
            </p>
          )}
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <StatusBadge status={b.status} />
          <PaymentBadge status={b.paymentStatus} method={b.paymentMethod} />
          {canCancel && (
            <button
              type="button"
              onClick={handleCancel}
              disabled={busy}
              className="mt-1 inline-flex items-center gap-1 rounded-full border border-red-200 bg-white px-3 py-1 text-[11px] font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
            >
              {busy ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <X className="h-3 w-3" />
              )}
              Cancel booking
            </button>
          )}
        </div>
      </div>
      {rowError && (
        <p className="mt-2 text-xs text-red-700">{rowError}</p>
      )}
      {canPayOnline && (
        <div className="mt-3">
          <EsewaPayButton bookingId={b.id} />
        </div>
      )}
    </li>
  );
}

function StatusBadge({ status }: { status: Booking["status"] }) {
  const styles: Record<Booking["status"], string> = {
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

function PaymentBadge({
  status,
  method,
}: {
  status: Booking["paymentStatus"];
  method: Booking["paymentMethod"];
}) {
  const labels: Record<Booking["paymentStatus"], string> = {
    advance_pending: "Advance pending",
    awaiting_arrival: "Pay on arrival",
    paid: "Paid",
  };
  const styles: Record<Booking["paymentStatus"], string> = {
    advance_pending: "bg-brand-light text-brand-dark",
    awaiting_arrival: "bg-soft text-ink",
    paid: "bg-green-100 text-green-800",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold ${styles[status]}`}
      title={method === "advance" ? "Advance reservation" : "Pay on arrival"}
    >
      {labels[status]}
    </span>
  );
}
