"use client";

import { useCallback, useState, type FormEvent } from "react";
import { Loader2, Sparkles, X } from "lucide-react";
import { aiService } from "@/lib/api/ai.service";
import { extractApiError } from "@/lib/api/client";
import type { SemanticSearchResult } from "@/types";

type Props = {
  onResults: (results: SemanticSearchResult[]) => void;
  onClear: () => void;
  active: boolean;
};

export default function AISearchBar({ onResults, onClear, active }: Props) {
  const [query, setQuery] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      const q = query.trim();
      if (!q || pending) return;
      setPending(true);
      setError(null);
      try {
        const res = await aiService.search(q);
        onResults(res.results);
      } catch (err) {
        setError(extractApiError(err, "AI search is unavailable"));
      } finally {
        setPending(false);
      }
    },
    [query, pending, onResults]
  );

  const clear = useCallback(() => {
    setQuery("");
    setError(null);
    onClear();
  }, [onClear]);

  return (
    <div className="mb-5 rounded-2xl border border-brand/20 bg-gradient-to-r from-brand-light/40 to-white p-4 shadow-sm">
      <form onSubmit={submit} className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2 sm:flex-1">
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand text-white">
            <Sparkles className="h-4 w-4" />
          </span>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            maxLength={200}
            placeholder="Try: peaceful mountain views in autumn, budget family trek…"
            className="w-full rounded-full border border-black/10 bg-white px-4 py-2 text-sm focus:border-brand focus:outline-none"
          />
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={pending || query.trim().length < 2}
            className="inline-flex items-center gap-1.5 rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-50"
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Ask AI
          </button>
          {active && (
            <button
              type="button"
              onClick={clear}
              className="inline-flex items-center gap-1 rounded-full border border-black/10 px-3 py-2 text-xs font-semibold text-ink hover:bg-soft"
            >
              <X className="h-3.5 w-3.5" />
              Clear
            </button>
          )}
        </div>
      </form>
      {error && (
        <p className="mt-2 text-xs text-red-700">{error}</p>
      )}
      <p className="mt-2 text-[11px] text-muted">
        Describe what you want in plain English. The AI re-ranks tours based on your intent.
      </p>
    </div>
  );
}
