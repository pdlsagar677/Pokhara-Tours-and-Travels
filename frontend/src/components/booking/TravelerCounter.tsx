"use client";

import { Minus, Plus } from "lucide-react";

type Props = {
  label: string;
  hint?: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
};

export default function TravelerCounter({
  label,
  hint,
  value,
  onChange,
  min = 0,
  max = 20,
}: Props) {
  const dec = () => onChange(Math.max(min, value - 1));
  const inc = () => onChange(Math.min(max, value + 1));

  return (
    <div className="flex items-center justify-between rounded-xl border border-black/10 bg-white px-4 py-3">
      <div>
        <p className="text-sm font-medium text-ink">{label}</p>
        {hint && <p className="text-xs text-muted">{hint}</p>}
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={dec}
          disabled={value <= min}
          aria-label={`Decrease ${label}`}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-black/10 text-ink hover:border-brand hover:text-brand transition disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Minus className="h-4 w-4" />
        </button>
        <span className="w-8 text-center font-display text-lg font-bold text-ink tabular-nums">
          {value}
        </span>
        <button
          type="button"
          onClick={inc}
          disabled={value >= max}
          aria-label={`Increase ${label}`}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-black/10 text-ink hover:border-brand hover:text-brand transition disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
