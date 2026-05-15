"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { bookingsService } from "@/lib/api/bookings.service";
import { extractApiError } from "@/lib/api/client";

export default function EsewaPayButton({
  bookingId,
  className,
}: {
  bookingId: string;
  className?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startPayment() {
    setBusy(true);
    setError(null);
    try {
      const { url, fields } = await bookingsService.initEsewa(bookingId);

      const form = document.createElement("form");
      form.method = "POST";
      form.action = url;
      form.style.display = "none";
      Object.entries(fields).forEach(([name, value]) => {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = name;
        input.value = String(value);
        form.appendChild(input);
      });
      document.body.appendChild(form);
      form.submit();
    } catch (err) {
      setError(extractApiError(err, "Could not start eSewa payment"));
      setBusy(false);
    }
  }

  return (
    <div className={className}>
      <button
        type="button"
        onClick={startPayment}
        disabled={busy}
        className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#60BB46] px-6 py-3 text-sm font-bold text-white shadow-sm hover:brightness-95 transition disabled:opacity-60"
      >
        {busy ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <span className="font-extrabold tracking-wider">eSewa</span>
        )}
        Pay with eSewa now
      </button>
      {error && (
        <p className="mt-2 text-center text-xs text-red-700">{error}</p>
      )}
    </div>
  );
}
