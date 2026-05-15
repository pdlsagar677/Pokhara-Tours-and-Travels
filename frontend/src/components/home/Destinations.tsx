"use client";

import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Loader2, MapPin, Sparkles } from "lucide-react";
import { packagesService } from "@/lib/api/packages.service";
import { extractApiError } from "@/lib/api/client";
import { formatNPR } from "@/lib/utils";
import type { Package } from "@/types";

const PackageDetailDialog = dynamic(
  () => import("@/components/packages/PackageDetailDialog"),
  { ssr: false }
);

type Props = {
  initialPackages?: Package[];
};

export default function Destinations({ initialPackages }: Props = {}) {
  const [items, setItems] = useState<Package[] | null>(
    initialPackages && initialPackages.length > 0 ? initialPackages : null
  );
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState<Package | null>(null);

  useEffect(() => {
    if (initialPackages && initialPackages.length > 0) return;
    let cancelled = false;
    (async () => {
      try {
        const list = await packagesService.list();
        const featured = [...list]
          .sort(
            (a, b) =>
              Number(b.isOffer) - Number(a.isOffer) ||
              Date.parse(b.createdAt) - Date.parse(a.createdAt)
          )
          .slice(0, 3);
        if (!cancelled) setItems(featured);
      } catch (err) {
        if (!cancelled) setError(extractApiError(err, "Could not load packages"));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [initialPackages]);

  return (
    <section className="bg-white py-20">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold uppercase tracking-widest text-brand">
            Popular destinations
          </span>
          <h2 className="mt-2 font-display text-3xl font-extrabold leading-tight text-ink md:text-4xl">
            Where Nepal calls you next
          </h2>
          <p className="mt-4 text-muted">
            Hand-picked tours across Pokhara, the Annapurnas, Everest, and beyond.
          </p>
        </div>

        {!items && !error && (
          <div className="mt-12 flex items-center justify-center text-muted">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        )}

        {error && (
          <div className="mt-12 rounded-2xl border border-red-200 bg-red-50 p-4 text-center text-sm text-red-700">
            {error}
          </div>
        )}

        {items && items.length === 0 && (
          <div className="mt-12 rounded-3xl border border-dashed border-black/10 bg-soft p-10 text-center">
            <p className="text-sm text-muted">
              No tour packages have been published yet.
            </p>
            <p className="mt-1 text-xs text-muted">
              Admins can add packages from the admin panel.
            </p>
          </div>
        )}

        {items && items.length > 0 && (
          <>
            <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((p, idx) => (
                <PackageCard
                  key={p.id}
                  pkg={p}
                  index={idx}
                  onOpen={() => setActive(p)}
                />
              ))}
            </div>

            <div className="mt-10 text-center">
              <Link
                href="/destinations"
                className="inline-flex items-center gap-2 rounded-full border border-brand/30 px-6 py-3 text-sm font-semibold text-brand hover:bg-brand-light transition"
              >
                See all packages
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </>
        )}
      </div>

      <PackageDetailDialog
        pkg={active}
        onClose={() => setActive(null)}
        onSelectPackage={setActive}
      />
    </section>
  );
}

function PackageCard({
  pkg,
  index,
  onOpen,
}: {
  pkg: Package;
  index: number;
  onOpen: () => void;
}) {
  const cover = pkg.gallery[0];
  return (
    <motion.button
      type="button"
      onClick={onOpen}
      aria-label={`View details for ${pkg.title}`}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        delay: Math.min(index, 6) * 0.08,
        ease: [0.22, 1, 0.36, 1],
      }}
      whileHover={{ y: -6 }}
      className="group relative aspect-[3/4] overflow-hidden rounded-2xl bg-soft text-left shadow-sm transition-shadow duration-300 hover:shadow-[0_25px_50px_-20px_rgba(2,132,199,0.45),inset_0_0_0_1px_rgba(255,255,255,0.25),inset_0_-80px_100px_-40px_rgba(2,132,199,0.45)]"
    >
      {cover ? (
        <Image
          src={cover}
          alt={pkg.title}
          fill
          sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw"
          unoptimized
          className="object-cover transition duration-500 group-hover:scale-110"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-brand-light to-soft">
          <MapPin className="h-10 w-10 text-brand/50" />
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />

      <span className="absolute left-4 top-4 rounded-full bg-accent px-3 py-1 text-xs font-bold text-white">
        {formatNPR(pkg.priceNPR)}
      </span>

      {pkg.isOffer && (
        <span className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-white/95 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-accent shadow-sm backdrop-blur">
          <Sparkles className="h-3 w-3" />
          Offer
        </span>
      )}

      <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-3 text-white">
        <div className="min-w-0">
          <h3 className="font-display text-lg font-extrabold leading-tight line-clamp-2">
            {pkg.title}
          </h3>
          <p className="mt-1 text-xs font-semibold opacity-90">Read more →</p>
        </div>
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/20 backdrop-blur transition group-hover:bg-brand">
          <MapPin className="h-4 w-4" />
        </span>
      </div>
    </motion.button>
  );
}
