"use client";

import { memo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
  className?: string;
};

function PaginationImpl({ page, totalPages, onChange, className }: Props) {
  if (totalPages <= 1) return null;

  const pages = pageList(page, totalPages);

  return (
    <nav
      aria-label="Pagination"
      className={cn("mt-8 flex flex-wrap items-center justify-center gap-2", className)}
    >
      <button
        type="button"
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        aria-label="Previous page"
        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-black/10 bg-white text-ink transition hover:bg-soft disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      {pages.map((p, idx) =>
        p === "…" ? (
          <span
            key={`ellipsis-${idx}`}
            className="px-2 text-sm text-muted select-none"
          >
            …
          </span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => onChange(p)}
            aria-current={p === page ? "page" : undefined}
            className={cn(
              "h-9 min-w-9 rounded-full border px-3 text-sm font-semibold transition",
              p === page
                ? "border-brand bg-brand text-white shadow-sm"
                : "border-black/10 bg-white text-ink hover:bg-soft"
            )}
          >
            {p}
          </button>
        )
      )}

      <button
        type="button"
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
        aria-label="Next page"
        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-black/10 bg-white text-ink transition hover:bg-soft disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </nav>
  );
}

function pageList(current: number, total: number): (number | "…")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const out: (number | "…")[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  if (start > 2) out.push("…");
  for (let i = start; i <= end; i++) out.push(i);
  if (end < total - 1) out.push("…");
  out.push(total);
  return out;
}

const Pagination = memo(PaginationImpl);
export default Pagination;
