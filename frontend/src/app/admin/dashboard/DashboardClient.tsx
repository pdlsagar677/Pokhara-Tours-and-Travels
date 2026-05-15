"use client";

import { useEffect, useState } from "react";
import {
  CalendarCheck,
  Loader2,
  Package,
  TrendingUp,
  Users,
} from "lucide-react";
import PageHeader from "@/components/admin/PageHeader";
import Placeholder from "@/components/admin/Placeholder";
import { adminService } from "@/lib/api/admin.service";
import { extractApiError } from "@/lib/api/client";
import { formatNPR } from "@/lib/utils";
import type {
  AdminBooking,
  BookingStatus,
  DashboardStats,
  PaymentStatus,
} from "@/types";

export default function DashboardClient() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await adminService.getDashboardStats();
        if (!cancelled) setStats(data);
      } catch (err) {
        if (!cancelled) setError(extractApiError(err, "Could not load stats"));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const cards = [
    {
      label: "Total users",
      value: stats ? stats.counts.users.toLocaleString() : "—",
      icon: Users,
      color: "bg-brand-light text-brand",
      footnote: "lifetime",
    },
    {
      label: "Active packages",
      value: stats ? stats.counts.packages.toLocaleString() : "—",
      icon: Package,
      color: "bg-orange-100 text-accent",
      footnote: "lifetime",
    },
    {
      label: "Bookings (30d)",
      value: stats ? stats.counts.bookings30d.toLocaleString() : "—",
      icon: CalendarCheck,
      color: "bg-green-100 text-green-700",
      footnote: `${stats?.counts.bookings ?? 0} all-time`,
    },
    {
      label: "Revenue (30d)",
      value: stats ? formatNPR(stats.revenue.last30dNPR) : "—",
      icon: TrendingUp,
      color: "bg-purple-100 text-purple-700",
      footnote: stats
        ? `${formatNPR(stats.revenue.lifetimeNPR)} all-time`
        : "lifetime",
    },
  ];

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="A quick snapshot of what's happening across Pokhara Tours and Travel."
      />

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(({ label, value, icon: Icon, color, footnote }) => (
          <div
            key={label}
            className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm"
          >
            <div className="flex items-start justify-between">
              <span
                className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${color}`}
              >
                <Icon className="h-5 w-5" />
              </span>
              <span className="text-xs text-muted">{footnote}</span>
            </div>
            <p className="mt-4 text-3xl font-extrabold text-ink">
              {!stats && !error ? (
                <Loader2 className="h-6 w-6 animate-spin text-muted" />
              ) : (
                value
              )}
            </p>
            <p className="mt-1 text-sm text-muted">{label}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <RecentBookings
          items={stats?.recentBookings ?? null}
          loading={!stats && !error}
        />
        <Placeholder
          title="Top destinations"
          description="Most-booked destinations and packages will rank here once data flows in."
        />
      </div>
    </>
  );
}

function RecentBookings({
  items,
  loading,
}: {
  items: AdminBooking[] | null;
  loading: boolean;
}) {
  return (
    <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
      <h2 className="font-display text-lg font-bold text-ink">Recent bookings</h2>
      <p className="mt-1 text-xs text-muted">The latest 5 reservations.</p>

      {loading && (
        <div className="mt-6 flex items-center justify-center text-muted">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      )}

      {!loading && items && items.length === 0 && (
        <p className="mt-6 text-sm text-muted">No bookings yet.</p>
      )}

      {!loading && items && items.length > 0 && (
        <ul className="mt-4 divide-y divide-black/5">
          {items.map((b) => (
            <li key={b.id} className="py-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-ink line-clamp-1">
                    {b.contact.name}
                  </p>
                  <p className="text-xs text-muted line-clamp-1">
                    {b.packageSnapshot?.title || b.packageSlug}
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    {new Date(b.createdAt).toLocaleString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <MiniStatusBadge status={b.status} />
                  <MiniPaymentBadge status={b.paymentStatus} />
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function MiniStatusBadge({ status }: { status: BookingStatus }) {
  const styles: Record<BookingStatus, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    confirmed: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize ${styles[status]}`}
    >
      {status}
    </span>
  );
}

function MiniPaymentBadge({ status }: { status: PaymentStatus }) {
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
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}
