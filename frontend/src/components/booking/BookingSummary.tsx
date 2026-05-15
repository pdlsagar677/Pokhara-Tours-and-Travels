"use client";

import Image from "next/image";
import { ImageOff } from "lucide-react";
import type { Package } from "@/types";
import { formatNPR } from "@/lib/utils";

type Props = {
  pkg: Package;
  adults: number;
  children: number;
};

export default function BookingSummary({ pkg, adults, children }: Props) {
  const childPrice = Math.round(pkg.priceNPR / 2);
  const adultsTotal = adults * pkg.priceNPR;
  const childrenTotal = children * childPrice;
  const total = adultsTotal + childrenTotal;

  return (
    <aside className="lg:sticky lg:top-24 rounded-3xl border border-black/5 bg-white shadow-sm overflow-hidden">
      <div className="relative aspect-[16/10] bg-soft">
        {pkg.gallery[0] ? (
          <Image
            src={pkg.gallery[0]}
            alt={pkg.title}
            fill
            sizes="(min-width:1024px) 360px, 100vw"
            unoptimized
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted">
            <ImageOff className="h-8 w-8" />
          </div>
        )}
      </div>

      <div className="p-5">
        <p className="text-xs uppercase tracking-widest text-brand">Your trip</p>
        <h2 className="mt-1 font-display text-lg font-extrabold leading-tight text-ink">
          {pkg.title}
        </h2>
        <p className="mt-1 text-xs text-muted">{formatNPR(pkg.priceNPR)} per adult</p>

        <dl className="mt-5 space-y-2 text-sm">
          <Row
            label={`Adults × ${adults}`}
            value={formatNPR(adultsTotal)}
          />
          {children > 0 && (
            <Row
              label={`Children × ${children}`}
              value={formatNPR(childrenTotal)}
              hint="50% of adult price"
            />
          )}
        </dl>

        <div className="mt-5 flex items-end justify-between border-t border-black/10 pt-4">
          <p className="text-sm text-muted">Total</p>
          <p className="font-display text-2xl font-extrabold text-ink">
            {formatNPR(total)}
          </p>
        </div>

        <p className="mt-2 text-xs text-muted">
          Final amount confirmed by our team after booking review.
        </p>
      </div>
    </aside>
  );
}

function Row({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="text-ink">
        <p>{label}</p>
        {hint && <p className="text-xs text-muted">{hint}</p>}
      </div>
      <p className="font-semibold text-ink tabular-nums">{value}</p>
    </div>
  );
}
