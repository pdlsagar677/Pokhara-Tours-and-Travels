"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { ImageOff, Sparkles } from "lucide-react";
import { aiService } from "@/lib/api/ai.service";
import { formatNPR } from "@/lib/utils";
import type { Package } from "@/types";

type Props = {
  slug: string;
  onSelect?: (pkg: Package) => void;
};

export default function SimilarPackages({ slug, onSelect }: Props) {
  const [items, setItems] = useState<Package[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    setItems(null);
    (async () => {
      try {
        const data = await aiService.similar(slug);
        if (!cancelled) setItems(data.results);
      } catch {
        if (!cancelled) setItems([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (!items || items.length === 0) return null;

  return (
    <section className="mt-7 border-t border-black/5 pt-5">
      <h3 className="font-display text-base font-bold text-ink">Travellers also book</h3>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        {items.map((p) => (
          <button
            type="button"
            key={p.id}
            onClick={() => onSelect?.(p)}
            className="group flex flex-col overflow-hidden rounded-xl border border-black/5 bg-white text-left shadow-sm transition hover:shadow-md"
          >
            <div className="relative aspect-[16/10] bg-soft">
              {p.gallery[0] ? (
                <Image
                  src={p.gallery[0]}
                  alt={p.title}
                  fill
                  sizes="(min-width:640px) 33vw, 100vw"
                  unoptimized
                  className="object-cover transition duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-brand-light text-brand/60">
                  <ImageOff className="h-6 w-6" />
                </div>
              )}
              {p.isOffer && (
                <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-white/95 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-accent shadow-sm">
                  <Sparkles className="h-2.5 w-2.5" />
                  Offer
                </span>
              )}
            </div>
            <div className="flex flex-1 flex-col px-3 py-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-brand">
                {p.category}
              </span>
              <h4 className="mt-0.5 font-display text-sm font-bold leading-snug text-ink line-clamp-2">
                {p.title}
              </h4>
              <span className="mt-1 text-xs font-semibold text-ink">
                {formatNPR(p.priceNPR)}
              </span>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
