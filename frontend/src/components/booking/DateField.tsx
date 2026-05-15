"use client";

import { forwardRef } from "react";
import { Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
};

const todayISO = (() => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
})();

const DateField = forwardRef<HTMLInputElement, Props>(function DateField(
  { label = "Trip start date", error, className, ...rest },
  ref
) {
  return (
    <div>
      {label && (
        <label htmlFor={rest.id || "startDate"} className="text-sm font-medium text-ink">
          {label}
        </label>
      )}
      <div className="relative mt-1">
        <Calendar className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
        <input
          ref={ref}
          id={rest.id || "startDate"}
          type="date"
          min={todayISO}
          className={cn(
            "w-full rounded-xl border border-black/10 bg-white pl-11 pr-4 py-3 text-sm text-ink focus:border-brand focus:outline-none",
            className
          )}
          {...rest}
        />
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
});

export default DateField;
