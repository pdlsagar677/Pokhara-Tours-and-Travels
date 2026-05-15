"use client";

import { useCallback, useState } from "react";
import { Loader2, ScrollText, X } from "lucide-react";
import { aiService } from "@/lib/api/ai.service";
import { extractApiError } from "@/lib/api/client";
import type { Itinerary } from "@/types";

type Props = {
  slug: string;
};

export default function ItineraryButton({ slug }: Props) {
  const [open, setOpen] = useState(false);
  const [days, setDays] = useState(3);
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(async () => {
    setLoading(true);
    setError(null);
    setItinerary(null);
    try {
      const res = await aiService.itinerary(slug, { days, adults, children });
      setItinerary(res.itinerary);
    } catch (err) {
      setError(extractApiError(err, "Could not generate itinerary"));
    } finally {
      setLoading(false);
    }
  }, [slug, days, adults, children]);

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          setItinerary(null);
          setError(null);
        }}
        className="inline-flex items-center gap-2 rounded-full border border-brand/30 px-5 py-2 text-sm font-semibold text-brand transition hover:bg-brand-light"
      >
        <ScrollText className="h-4 w-4" />
        AI itinerary
      </button>

      {open && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-t-3xl bg-white shadow-xl sm:rounded-3xl">
            <header className="flex items-center justify-between gap-3 border-b border-black/5 px-6 py-4">
              <div>
                <h3 className="font-display text-lg font-extrabold text-ink">Plan your trip</h3>
                <p className="text-xs text-muted">AI-generated day-by-day plan</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-soft text-ink hover:bg-black/5"
              >
                <X className="h-4 w-4" />
              </button>
            </header>

            <div className="px-6 py-5">
              <div className="grid grid-cols-3 gap-3">
                <NumberField label="Days" value={days} setValue={setDays} min={1} max={14} />
                <NumberField label="Adults" value={adults} setValue={setAdults} min={1} max={20} />
                <NumberField label="Children" value={children} setValue={setChildren} min={0} max={20} />
              </div>

              <button
                type="button"
                onClick={generate}
                disabled={loading}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ScrollText className="h-4 w-4" />}
                {loading ? "Generating…" : "Generate itinerary"}
              </button>

              {error && (
                <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                  {error}
                </div>
              )}

              {itinerary && itinerary.days.length > 0 && (
                <ol className="mt-5 space-y-3">
                  {itinerary.days.map((d) => (
                    <li
                      key={d.day}
                      className="rounded-2xl border border-black/5 bg-soft/60 p-3"
                    >
                      <div className="flex items-center gap-2">
                        <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-brand px-2 text-[11px] font-bold text-white">
                          Day {d.day}
                        </span>
                        <span className="font-display text-sm font-bold text-ink">
                          {d.title}
                        </span>
                      </div>
                      <ul className="mt-2 space-y-1 text-xs leading-relaxed text-muted">
                        {d.activities.map((a, idx) => (
                          <li key={idx} className="flex gap-1.5">
                            <span className="mt-0.5 text-brand">•</span>
                            <span>{a}</span>
                          </li>
                        ))}
                      </ul>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function NumberField({
  label,
  value,
  setValue,
  min,
  max,
}: {
  label: string;
  value: number;
  setValue: (n: number) => void;
  min: number;
  max: number;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">{label}</span>
      <input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(e) => {
          const n = Number(e.target.value);
          if (!Number.isFinite(n)) return;
          setValue(Math.min(max, Math.max(min, Math.round(n))));
        }}
        className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm focus:border-brand focus:outline-none"
      />
    </label>
  );
}
