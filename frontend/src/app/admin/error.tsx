"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center shadow-sm">
      <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-red-700">
        <AlertTriangle className="h-6 w-6" />
      </span>
      <h2 className="mt-4 font-display text-xl font-bold text-ink">
        Something broke in the admin panel
      </h2>
      <p className="mt-2 text-sm text-muted">
        {error.message || "An unexpected error occurred. Try again."}
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-5 inline-flex items-center gap-2 rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark"
      >
        <RotateCcw className="h-4 w-4" />
        Try again
      </button>
    </div>
  );
}
