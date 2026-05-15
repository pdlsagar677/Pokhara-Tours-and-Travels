"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  ImageOff,
  MapPin,
  Plane,
  X,
} from "lucide-react";
import type { Package } from "@/types";
import { cn, formatNPR } from "@/lib/utils";
import { useAuthStore } from "@/store/auth.store";
import BestSeasonBadge from "@/components/ai/BestSeasonBadge";
import ItineraryButton from "@/components/ai/ItineraryButton";
import SimilarPackages from "@/components/ai/SimilarPackages";

type Props = {
  pkg: Package | null;
  onClose: () => void;
  onSelectPackage?: (pkg: Package) => void;
};

export default function PackageDetailDialog({ pkg, onClose, onSelectPackage }: Props) {
  const router = useRouter();
  const [activeIdx, setActiveIdx] = useState(0);

  const onBook = () => {
    if (!pkg) return;
    const target = `/booking?package=${encodeURIComponent(pkg.slug)}`;
    const isAuthed = useAuthStore.getState().isAuthenticated;
    onClose();
    if (isAuthed) {
      router.push(target);
    } else {
      router.push(`/login?next=${encodeURIComponent(target)}`);
    }
  };

  const galleryLen = pkg?.gallery.length ?? 0;
  const next = useCallback(
    () => setActiveIdx((i) => (galleryLen ? (i + 1) % galleryLen : 0)),
    [galleryLen]
  );
  const prev = useCallback(
    () =>
      setActiveIdx((i) =>
        galleryLen ? (i - 1 + galleryLen) % galleryLen : 0
      ),
    [galleryLen]
  );

  useEffect(() => {
    if (!pkg) return;
    setActiveIdx(0);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") prev();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [pkg, onClose, next, prev]);

  if (!pkg) return null;

  const mainImage = pkg.gallery[activeIdx];
  const created = new Date(pkg.createdAt);
  const hasMultiple = pkg.gallery.length > 1;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div className="relative w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-t-3xl bg-white shadow-xl sm:rounded-3xl">
        {/* Image slider */}
        <div className="relative aspect-[16/10] bg-soft group/slider overflow-hidden">
          {pkg.gallery.length > 0 ? (
            <>
              {pkg.gallery.map((url, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "absolute inset-0 transition-opacity duration-500 ease-out",
                    idx === activeIdx ? "opacity-100" : "opacity-0 pointer-events-none"
                  )}
                  aria-hidden={idx !== activeIdx}
                >
                  <Image
                    src={url}
                    alt={`${pkg.title} — image ${idx + 1}`}
                    fill
                    sizes="(min-width:768px) 768px, 100vw"
                    priority={idx === 0}
                    unoptimized
                    className="object-cover"
                  />
                </div>
              ))}
            </>
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-light to-soft text-brand/60">
              <ImageOff className="h-12 w-12" />
            </div>
          )}

          {/* Top overlays: close + price */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute right-4 top-4 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur transition hover:bg-black/70"
          >
            <X className="h-5 w-5" />
          </button>
          <span className="absolute left-4 top-4 z-10 inline-flex items-center rounded-full bg-accent px-4 py-1.5 text-sm font-bold text-white shadow-sm">
            {formatNPR(pkg.priceNPR)}
          </span>

          {/* Slider controls */}
          {hasMultiple && (
            <>
              <button
                type="button"
                onClick={prev}
                aria-label="Previous image"
                className="absolute left-3 top-1/2 z-10 -translate-y-1/2 inline-flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur opacity-0 transition group-hover/slider:opacity-100 hover:bg-black/60 sm:opacity-100"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={next}
                aria-label="Next image"
                className="absolute right-3 top-1/2 z-10 -translate-y-1/2 inline-flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur opacity-0 transition group-hover/slider:opacity-100 hover:bg-black/60 sm:opacity-100"
              >
                <ChevronRight className="h-5 w-5" />
              </button>

              {/* Dot indicators */}
              <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-black/40 px-3 py-1.5 backdrop-blur">
                {pkg.gallery.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveIdx(idx)}
                    aria-label={`Go to image ${idx + 1}`}
                    className={cn(
                      "h-1.5 rounded-full transition-all",
                      idx === activeIdx
                        ? "w-6 bg-white"
                        : "w-1.5 bg-white/50 hover:bg-white/80"
                    )}
                  />
                ))}
              </div>

              {/* Counter (top-center) */}
              <span className="absolute top-4 left-1/2 z-10 -translate-x-1/2 rounded-full bg-black/40 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
                {activeIdx + 1} / {pkg.gallery.length}
              </span>
            </>
          )}
        </div>

        {/* Body */}
        <div className="px-6 py-6 md:px-8 md:py-8">
          <h2 className="font-display text-2xl font-extrabold leading-tight text-ink md:text-3xl">
            {pkg.title}
          </h2>

          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted">
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-4 w-4 text-brand" />
              Nepal
            </span>
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-4 w-4 text-brand" />
              Listed{" "}
              {created.toLocaleDateString(undefined, {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>

          <BestSeasonBadge slug={pkg.slug} />

          {/* Thumbnail strip (also navigates) */}
          {hasMultiple && (
            <div className="mt-5 flex gap-2 overflow-x-auto pb-2">
              {pkg.gallery.map((url, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveIdx(idx)}
                  aria-label={`Show image ${idx + 1}`}
                  className={cn(
                    "relative h-14 w-20 shrink-0 overflow-hidden rounded-lg border-2 transition",
                    idx === activeIdx
                      ? "border-brand shadow-sm"
                      : "border-transparent opacity-60 hover:opacity-100"
                  )}
                >
                  <Image
                    src={url}
                    alt=""
                    fill
                    sizes="80px"
                    unoptimized
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          )}

          {/* Description */}
          <div className="mt-6">
            <h3 className="font-display text-base font-bold text-ink">
              About this trip
            </h3>
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted">
              {pkg.description}
            </p>
          </div>

          {/* Footer CTAs */}
          <div className="mt-7 flex flex-wrap items-center justify-between gap-3 border-t border-black/5 pt-5">
            <div className="text-sm">
              <span className="text-muted">From </span>
              <span className="font-display text-xl font-extrabold text-ink">
                {formatNPR(pkg.priceNPR)}
              </span>
              <span className="ml-1 text-xs text-muted">/ person</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-black/10 px-5 py-2 text-sm font-semibold text-ink hover:bg-soft transition"
              >
                Close
              </button>
              <ItineraryButton slug={pkg.slug} />
              <button
                type="button"
                onClick={onBook}
                className="inline-flex items-center gap-2 rounded-full bg-brand px-6 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-dark transition"
              >
                <Plane className="h-4 w-4" />
                Book this trip
              </button>
            </div>
          </div>

          <SimilarPackages slug={pkg.slug} onSelect={onSelectPackage} />
        </div>
      </div>
    </div>
  );
}
