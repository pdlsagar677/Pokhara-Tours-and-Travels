"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { XCircle } from "lucide-react";

export default function FailureClient() {
  const search = useSearchParams();
  const data = search.get("data");
  const message = search.get("message") || search.get("error");

  let decoded: Record<string, unknown> | null = null;
  if (data) {
    try {
      decoded = JSON.parse(atob(data));
    } catch {
      decoded = null;
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-14 md:px-8">
      <div className="rounded-3xl border border-black/5 bg-white p-8 shadow-sm md:p-10 text-center">
        <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-700">
          <XCircle className="h-8 w-8" />
        </div>
        <h1 className="mt-5 font-display text-2xl font-extrabold text-ink md:text-3xl">
          Payment didn&apos;t go through
        </h1>
        <p className="mt-2 text-sm text-muted">
          Your booking is still saved as pending. You can try the payment
          again from your profile, or pay later.
        </p>

        {message && (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-left">
            <p className="text-xs uppercase tracking-wider text-red-700">
              eSewa response
            </p>
            <p className="mt-1 text-sm text-red-800">{message}</p>
          </div>
        )}

        {decoded && (
          <div className="mt-5 rounded-xl border border-black/10 bg-soft p-4 text-left">
            <p className="text-xs uppercase tracking-wider text-muted">
              eSewa payload
            </p>
            <pre className="mt-1 overflow-x-auto text-xs text-ink">
              {JSON.stringify(decoded, null, 2)}
            </pre>
          </div>
        )}

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
      </div>
    </div>
  );
}
