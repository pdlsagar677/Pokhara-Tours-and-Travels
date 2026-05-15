"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { bookingsService } from "@/lib/api/bookings.service";
import { extractApiError } from "@/lib/api/client";
import { formatNPR } from "@/lib/utils";
import type { Booking } from "@/types";

export default function SuccessClient() {
  const search = useSearchParams();
  const data = search.get("data");
  const [state, setState] = useState<"verifying" | "ok" | "error">("verifying");
  const [booking, setBooking] = useState<Booking | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!data) {
      setState("error");
      setError("Missing payment data in the redirect.");
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const updated = await bookingsService.verifyEsewa(data);
        if (cancelled) return;
        setBooking(updated);
        setState("ok");
      } catch (err) {
        if (cancelled) return;
        setError(
          extractApiError(err, "We couldn't verify the payment. Please contact support.")
        );
        setState("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [data]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-14 md:px-8">
      <div className="rounded-3xl border border-black/5 bg-white p-8 shadow-sm md:p-10">
        {state === "verifying" && (
          <div className="flex flex-col items-center gap-4 py-8 text-muted">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="text-sm">Verifying your payment with eSewa…</p>
          </div>
        )}

        {state === "ok" && booking && (
          <>
            <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-700">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h1 className="mt-5 text-center font-display text-2xl font-extrabold text-ink md:text-3xl">
              Payment confirmed
            </h1>
            <p className="mt-2 text-center text-sm text-muted">
              Booking{" "}
              <span className="font-mono font-semibold text-ink">{booking.id}</span>{" "}
              is now paid. Thank you!
            </p>
            <dl className="mt-7 grid gap-3 rounded-2xl bg-soft p-5 text-sm sm:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted">Trip</p>
                <p className="mt-1 text-sm text-ink">
                  {booking.packageSnapshot?.title || booking.packageSlug}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-muted">Total paid</p>
                <p className="mt-1 font-display text-base font-extrabold text-ink">
                  {formatNPR(booking.totalNPR)}
                </p>
              </div>
              {booking.esewaTransactionCode && (
                <div className="sm:col-span-2">
                  <p className="text-xs uppercase tracking-wider text-muted">
                    eSewa reference
                  </p>
                  <p className="mt-1 font-mono text-xs text-ink">
                    {booking.esewaTransactionCode}
                  </p>
                </div>
              )}
            </dl>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/profile"
                className="inline-flex items-center rounded-full bg-brand px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark transition"
              >
                View my bookings
              </Link>
              <Link
                href="/destinations"
                className="inline-flex items-center rounded-full border border-brand/30 px-6 py-2.5 text-sm font-semibold text-brand hover:bg-brand-light transition"
              >
                Browse more trips
              </Link>
            </div>
          </>
        )}

        {state === "error" && (
          <>
            <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-700">
              <XCircle className="h-8 w-8" />
            </div>
            <h1 className="mt-5 text-center font-display text-2xl font-extrabold text-ink md:text-3xl">
              We couldn&apos;t verify the payment
            </h1>
            <p className="mt-2 text-center text-sm text-muted">{error}</p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/profile"
                className="inline-flex items-center rounded-full bg-brand px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark transition"
              >
                Go to my bookings
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center rounded-full border border-brand/30 px-6 py-2.5 text-sm font-semibold text-brand hover:bg-brand-light transition"
              >
                Contact support
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
