"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  BedDouble,
  Loader2,
  MapPin,
  MountainSnow,
  Plus,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import {
  packageFormSchema,
  type PackageFormInput,
} from "@/lib/validators/package.schema";
import { adminService } from "@/lib/api/admin.service";
import { extractApiError } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import { PACKAGE_CATEGORIES, type Package, type PackageType } from "@/types";

type Props = {
  open: boolean;
  initial?: Package | null;
  defaultType?: PackageType;
  onClose: () => void;
  onSaved: (pkg: Package) => void;
};

const TYPE_LABEL: Record<PackageType, string> = {
  destination: "Destination",
  hotel: "Hotel",
  adventure: "Adventure",
};

const TYPE_OPTIONS: { value: PackageType; label: string; icon: typeof MapPin }[] = [
  { value: "destination", label: "Destination", icon: MapPin },
  { value: "hotel", label: "Hotel", icon: BedDouble },
  { value: "adventure", label: "Adventure", icon: MountainSnow },
];

// Mirror of backend/src/utils/validators.js validateGalleryUrl. HTTPS only,
// no userinfo, no IP-literal hosts, length <= 500. Kept here (rather than
// importing) because /lib/api/* is the only place the frontend imports server
// code, and this is a small pure function.
function validateGalleryUrlClient(raw: string): string | null {
  const s = raw.trim();
  if (s.length === 0) return "URL is required";
  if (s.length > 500) return "URL is too long";
  let u: URL;
  try {
    u = new URL(s);
  } catch {
    return "Not a valid URL";
  }
  if (u.protocol !== "https:") return "Must be an https:// URL";
  if (u.username || u.password) return "Credentials in URLs are not allowed";
  const host = u.hostname;
  if (!host) return "Missing host";
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return "IP-literal hosts are not allowed";
  if (host.includes(":") || host.startsWith("[")) return "IP-literal hosts are not allowed";
  return null;
}

export default function PackageFormDialog({
  open,
  initial,
  defaultType = "destination",
  onClose,
  onSaved,
}: Props) {
  const isEdit = !!initial;

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<PackageFormInput>({
    resolver: zodResolver(packageFormSchema),
    defaultValues: {
      title: "",
      description: "",
      priceNPR: 0,
      isOffer: false,
      category: "tour",
    },
  });

  const [packageType, setPackageType] = useState<PackageType>("destination");
  const [gallery, setGallery] = useState<string[]>([""]);
  const [galleryError, setGalleryError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    if (initial) {
      reset({
        title: initial.title,
        description: initial.description,
        priceNPR: initial.priceNPR,
        isOffer: !!initial.isOffer,
        category: initial.category || "tour",
      });
      setPackageType(initial.type || "destination");
      setGallery(initial.gallery.length ? [...initial.gallery] : [""]);
    } else {
      reset({
        title: "",
        description: "",
        priceNPR: 0,
        isOffer: false,
        category: "tour",
      });
      setPackageType(defaultType);
      setGallery([""]);
    }
    setGalleryError(null);
  }, [open, initial, defaultType, reset]);

  const setUrl = (idx: number, value: string) => {
    setGallery((prev) => prev.map((u, i) => (i === idx ? value : u)));
  };
  const addRow = () => {
    if (gallery.length >= 5) return;
    setGallery((prev) => [...prev, ""]);
  };
  const removeRow = (idx: number) => {
    setGallery((prev) => prev.filter((_, i) => i !== idx));
  };

  const onSubmit = async (values: PackageFormInput) => {
    const cleaned = gallery.map((u) => u.trim()).filter(Boolean);
    if (cleaned.length > 5) {
      setGalleryError("At most 5 images");
      return;
    }
    for (const url of cleaned) {
      const reason = validateGalleryUrlClient(url);
      if (reason) {
        setGalleryError(`${reason}: ${url}`);
        return;
      }
    }
    setGalleryError(null);

    const payload = {
      title: values.title.trim(),
      description: values.description.trim(),
      priceNPR: values.priceNPR,
      gallery: cleaned,
      isOffer: values.isOffer,
      category: values.category,
      type: packageType,
    };
    try {
      const saved = isEdit
        ? await adminService.updatePackage(initial!.id, payload)
        : await adminService.createPackage(payload);
      onSaved(saved);
      onClose();
    } catch (err) {
      setError("root", { message: extractApiError(err, "Could not save package") });
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-white shadow-xl">
        <header className="sticky top-0 flex items-center justify-between border-b border-black/5 bg-white px-6 py-4 z-10">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display text-lg font-bold text-ink">
                {isEdit ? "Edit" : "Add"} {TYPE_LABEL[packageType].toLowerCase()}
              </h2>
              <span className="inline-flex items-center rounded-full bg-brand-light px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-brand-dark">
                {TYPE_LABEL[packageType]}
              </span>
            </div>
            <p className="text-xs text-muted">
              Title, description and price are required. Up to 5 image URLs.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-muted hover:bg-soft hover:text-ink"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-6 space-y-5">
          <div>
            <label className="text-sm font-medium text-ink">Type</label>
            <p className="mt-0.5 text-xs text-muted">
              What kind of listing this is. Changing it moves the package to the matching tab.
            </p>
            <div className="mt-2 inline-flex flex-wrap items-center gap-1 rounded-full border border-black/10 bg-white p-1">
              {TYPE_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const active = packageType === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setPackageType(opt.value)}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-semibold transition",
                      active
                        ? "bg-brand text-white shadow-sm"
                        : "text-ink hover:bg-soft"
                    )}
                    aria-pressed={active}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {errors.root && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {errors.root.message}
            </div>
          )}

          <div>
            <label htmlFor="title" className="text-sm font-medium text-ink">
              Title
            </label>
            <input
              id="title"
              type="text"
              className="mt-1 w-full rounded-xl border border-black/10 px-4 py-3 text-sm focus:border-brand focus:outline-none"
              placeholder="e.g. Annapurna Circuit — 12 days"
              {...register("title")}
            />
            {errors.title && (
              <p className="mt-1 text-xs text-red-600">{errors.title.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="description" className="text-sm font-medium text-ink">
              Description
            </label>
            <textarea
              id="description"
              rows={5}
              className="mt-1 w-full rounded-xl border border-black/10 px-4 py-3 text-sm focus:border-brand focus:outline-none"
              placeholder="What makes this trip special?"
              {...register("description")}
            />
            {errors.description && (
              <p className="mt-1 text-xs text-red-600">{errors.description.message}</p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="priceNPR" className="text-sm font-medium text-ink">
                Price (NPR)
              </label>
              <div className="relative mt-1">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-muted">
                  Rs.
                </span>
                <input
                  id="priceNPR"
                  type="number"
                  min={0}
                  step={1}
                  className="w-full rounded-xl border border-black/10 pl-12 pr-4 py-3 text-sm focus:border-brand focus:outline-none"
                  {...register("priceNPR", { valueAsNumber: true })}
                />
              </div>
              {errors.priceNPR && (
                <p className="mt-1 text-xs text-red-600">{errors.priceNPR.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="category" className="text-sm font-medium text-ink">
                Category
              </label>
              <select
                id="category"
                className="mt-1 w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm capitalize focus:border-brand focus:outline-none"
                {...register("category")}
              >
                {PACKAGE_CATEGORIES.map((c) => (
                  <option key={c} value={c} className="capitalize">
                    {c}
                  </option>
                ))}
              </select>
              {errors.category && (
                <p className="mt-1 text-xs text-red-600">{errors.category.message}</p>
              )}
            </div>
          </div>

          <label
            htmlFor="isOffer"
            className="flex cursor-pointer items-start gap-3 rounded-xl border border-black/10 bg-soft/60 p-4 transition hover:border-accent/40"
          >
            <input
              id="isOffer"
              type="checkbox"
              className="mt-0.5 h-4 w-4 rounded border-black/20 text-accent focus:ring-accent"
              {...register("isOffer")}
            />
            <div className="flex-1">
              <span className="flex items-center gap-1.5 text-sm font-medium text-ink">
                <Sparkles className="h-4 w-4 text-accent" />
                Mark as offer / promotion
              </span>
              <p className="mt-0.5 text-xs text-muted">
                Offers appear in their own section at the top of the destinations page with a featured ribbon.
              </p>
            </div>
          </label>

          <div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-ink">
                Image URLs <span className="text-muted">({gallery.length}/5)</span>
              </label>
              <button
                type="button"
                onClick={addRow}
                disabled={gallery.length >= 5}
                className="inline-flex items-center gap-1 rounded-full border border-brand/30 px-3 py-1 text-xs font-semibold text-brand hover:bg-brand-light transition disabled:opacity-50"
              >
                <Plus className="h-3 w-3" />
                Add URL
              </button>
            </div>
            <p className="mt-1 text-xs text-muted">
              Any direct image URL (https://…) works. The first image is used as the cover. Avoid search-result links like <code className="rounded bg-soft px-1">imgs.search.brave.com/…</code> — those expire; prefer Unsplash, Pexels, or your own CDN.
            </p>
            <div className="mt-2 space-y-2">
              {gallery.map((url, idx) => (
                <div key={idx} className="flex gap-2">
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(idx, e.target.value)}
                    placeholder="https://images.unsplash.com/photo-…"
                    className="flex-1 rounded-xl border border-black/10 px-4 py-2.5 text-sm focus:border-brand focus:outline-none"
                  />
                  <button
                    type="button"
                    aria-label="Remove image"
                    onClick={() => removeRow(idx)}
                    disabled={gallery.length === 1}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-black/10 text-muted hover:border-red-200 hover:bg-red-50 hover:text-red-600 transition disabled:opacity-40 disabled:hover:border-black/10 disabled:hover:bg-transparent disabled:hover:text-muted"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
            {galleryError && (
              <p className="mt-2 text-xs text-red-600">{galleryError}</p>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-black/5 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-black/10 px-5 py-2 text-sm font-semibold text-ink hover:bg-soft transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-brand px-6 py-2 text-sm font-semibold text-white hover:bg-brand-dark transition disabled:opacity-60"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEdit ? "Save changes" : "Create package"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
