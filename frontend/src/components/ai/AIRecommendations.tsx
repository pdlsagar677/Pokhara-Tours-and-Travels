"use client";

import Image from "next/image";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, MapPin, Sparkles, Wand2 } from "lucide-react";
import { aiService } from "@/lib/api/ai.service";
import { extractApiError } from "@/lib/api/client";
import { formatNPR } from "@/lib/utils";
import type { AIRecommendation, Package } from "@/types";

const PackageDetailDialog = dynamic(
  () => import("@/components/packages/PackageDetailDialog"),
  { ssr: false }
);

export default function AIRecommendations() {
  const [picks, setPicks] = useState<AIRecommendation[] | null>(null);
  const [personalized, setPersonalized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState<Package | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await aiService.recommendations(4);
        if (cancelled) return;
        setPicks(data.picks);
        setPersonalized(data.personalized);
      } catch (err) {
        if (!cancelled) setError(extractApiError(err, "Could not load recommendations"));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) return null;

  return (
    <section className="bg-gradient-to-b from-brand-light/30 to-white py-20">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-brand">
            <Wand2 className="h-3.5 w-3.5" />
            AI suggestions
          </span>
          <h2 className="mt-3 font-display text-3xl font-extrabold leading-tight text-ink md:text-4xl">
            {personalized ? "Recommended for you" : "Trending across Nepal"}
          </h2>
          <p className="mt-3 text-muted">
            {personalized
              ? "Picked based on your travel history and what fellow travellers are booking right now."
              : "Smart picks based on what travellers are booking this season."}
          </p>
        </div>

        {!picks && (
          <div className="mt-12 flex items-center justify-center text-muted">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        )}

        {picks && picks.length === 0 && (
          <div className="mt-12 rounded-3xl border border-dashed border-black/10 bg-white p-10 text-center text-sm text-muted">
            No recommendations available yet.
          </div>
        )}

        {picks && picks.length > 0 && (
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {picks.map((p, idx) => (
              <RecommendationCard
                key={p.id}
                pick={p}
                index={idx}
                onOpen={() => setActive(p)}
              />
            ))}
          </div>
        )}
      </div>

      <PackageDetailDialog
        pkg={active}
        onClose={() => setActive(null)}
        onSelectPackage={(p) => setActive(p)}
      />
    </section>
  );
}

function RecommendationCard({
  pick,
  index,
  onOpen,
}: {
  pick: AIRecommendation;
  index: number;
  onOpen: () => void;
}) {
  const cover = pick.gallery[0];
  return (
    <motion.button
      type="button"
      onClick={onOpen}
      aria-label={`View details for ${pick.title}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.45,
        delay: Math.min(index, 6) * 0.07,
        ease: [0.22, 1, 0.36, 1],
      }}
      whileHover={{ y: -4 }}
      className="group flex flex-col overflow-hidden rounded-2xl bg-white text-left shadow-sm ring-1 ring-black/5 transition hover:shadow-[0_18px_40px_-18px_rgba(2,132,199,0.4)]"
    >
      <div className="relative aspect-[16/10] bg-soft">
        {cover ? (
          <Image
            src={cover}
            alt={pick.title}
            fill
            sizes="(min-width:1024px) 25vw, (min-width:640px) 50vw, 100vw"
            unoptimized
            className="object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-brand-light to-soft">
            <MapPin className="h-8 w-8 text-brand/50" />
          </div>
        )}
        <span className="absolute left-3 top-3 rounded-full bg-accent px-2.5 py-1 text-[11px] font-bold text-white shadow-sm">
          {formatNPR(pick.priceNPR)}
        </span>
        {pick.isOffer && (
          <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-accent shadow-sm backdrop-blur">
            <Sparkles className="h-3 w-3" />
            Offer
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <span className="inline-flex w-fit items-center rounded-full bg-brand-light px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-brand-dark">
          {pick.category}
        </span>
        <h3 className="mt-2 font-display text-base font-extrabold leading-snug text-ink line-clamp-2">
          {pick.title}
        </h3>
        <p className="mt-2 text-xs leading-relaxed text-muted line-clamp-3 flex-1">
          <Wand2 className="mr-1 inline h-3 w-3 text-brand" />
          {pick.reason}
        </p>
      </div>
    </motion.button>
  );
}
