"use client";

import { useEffect, useState } from "react";
import { CalendarHeart } from "lucide-react";
import { aiService } from "@/lib/api/ai.service";

type Props = {
  slug: string;
};

export default function BestSeasonBadge({ slug }: Props) {
  const [note, setNote] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setNote(null);
    (async () => {
      try {
        const data = await aiService.bestSeason(slug);
        if (!cancelled) setNote(data.note);
      } catch {
        if (!cancelled) setNote(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (loading) {
    return (
      <div className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-brand/15 bg-brand-light/40 px-3 py-2 text-xs text-muted">
        <CalendarHeart className="h-3.5 w-3.5 text-brand" />
        Checking the best time to visit…
      </div>
    );
  }

  if (!note) return null;

  return (
    <div className="mt-4 flex items-start gap-2 rounded-2xl border border-brand/15 bg-brand-light/40 px-3 py-2 text-xs leading-relaxed text-ink">
      <CalendarHeart className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
      <span>{note}</span>
    </div>
  );
}
